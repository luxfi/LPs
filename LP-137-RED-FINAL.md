---
lp: 137
title: LP-137 Red Final Audit (post-#187..#241)
status: Adversarial
type: Audit
created: 2026-04-28
auditor: Red
branch: lp137-red-final-2026-04-28
---

# LP-137 — Final Adversarial Audit

Read-only re-attack of the LP-137 stack after #187..#241. Constraints: hanzo-dev,
no PRs. File:line cited for every finding. Severity is calibrated; "I could not
find anything" is treated as proof I did not look hard enough.

## Top 5 NEW exploitable findings

### N1 — [CRITICAL] KMS release gate never invokes the cc/attest pipeline

`mpc/pkg/kms/release.go:59-77` defines `CompositeAttestation` as a *narrow Go
interface* with `Verify(nonce)`, `RIMDigest()`, `HardwareFingerprint()`,
`TEEPublicKey()`. The release gate (`Release()`, `release.go:325-387`) only
calls `req.Attestation.Verify(rec.Nonce)` and `policy.Permits(att)`. It NEVER
calls `attestation.CompositeAttestation.VerifyEvidence(ctx, ...)` from
`mpc/pkg/attestation/composite.go:320`, which is the function that actually
invokes `cc/attest.Dispatch` (SEV-SNP chain verify, AMD KDS, VCEK, TCB).
Confirmed by `grep -rn '\.VerifyEvidence(' lux/*.go` returning zero call sites
outside the definition.

Attack: any worker presenting an in-process struct that satisfies the gate's
4-method interface and returns `(true, nil)` from `Verify()` gets the sealed
session key. The structural type used by the gate and the cryptographically
verified envelope from `cc/attest` are unrelated; the integration seam is
empty. The wins claimed in #222 (go-sev-guest v0.14.1, ARK→ASK→VCEK chain)
exist in the codebase but are dead code w.r.t. the release path.

Fix hint: gate must (a) require `*attestation.CompositeAttestation`, (b) call
`VerifyEvidence(ctx, opts...)` AND fail closed if any required issuer kind
returns `nil`/error, (c) bind the attestation root to `rec.Nonce`.

### N2 — [CRITICAL] TFHE fake-threshold guardUnsafe panics in production keygen path

`threshold/protocols/tfhe/tfhe.go:69-73 + :179 + :282 + :410` add `guardUnsafe()`
which `panic`s unless `LUX_ALLOW_FAKE_TFHE_FOR_TESTING_ONLY=1`.
`mpc/pkg/mpc/tfhe_session.go:154,165` (production wallet keygen) calls
`tfhe.NewKeyGenerator(...)` then `kg.GenerateKeys(...)` *without* setting that
env var. Any operator running `tfhe:keygen:*` will hit a hard panic — the
node crashes inside the keygen goroutine spawned from `node.go:583`.

This is reachable from the public `/v1/mpc/wallets POST` flow when wallet kind
`tfhe` is selected. DoS: one well-formed API call drops the node. Detectability:
panic is caught by the defer in tfheKeygenSession but the session terminates;
status is "error" with no recovery.

Worse: an operator who *does* set the env var to silence the panic gets the
documented unsafe behavior — every party stores the full master key
(`tfhe.go:424-431`), `PartialDecrypt` returns an HMAC tag
(`committee.go:283-294`), and `CombineShares` ignores partials and runs single-
party decrypt (`tfhe.go:281-315`). Either way, the production path is broken.

Fix hint: refuse construction at the API boundary unless the env var is set
*and* the deployment is dev/test. Better: route `mpc/pkg/mpc/tfhe_session.go`
through the real lattice threshold MPC committee per LP-137 §TFHE-REAL-
THRESHOLD-SPEC; remove the fake-threshold call sites entirely.

### N3 — [HIGH] Pedersen DST split: `NewGenerators` and `DeterministicGenerators` use the WRONG canonical DST

`crypto/pedersen/pedersen.go:50,54` calls
`bn254.HashToG1(gBytes, []byte("PEDERSEN_G_V1"))` and `"PEDERSEN_H_V1"`.
`crypto/pedersen/pedersen.go:84,90` (DeterministicGenerators) uses
`"LUX_PEDERSEN_G"` and `"LUX_PEDERSEN_H"`.
Only `crypto/pedersen/pedersen_seed.go:13`
(`SeededGenDST = "PEDERSEN_SEEDED_GEN_V1"`) matches the C++/Metal/CUDA/WGSL
canonical at `luxcpp/crypto/pedersen/cpp/pedersen.hpp:47`.

A Go caller using `pedersen.NewGenerators` or `DeterministicGenerators`
produces commitments that are *NOT* byte-equal to anything the C++/GPU layer
produces. The Metal kernel at `luxcpp/crypto/bn254/gpu/metal/bn254.metal:435`
expects the host to supply G,H as 8-limb buffers — if the host derived them
via the Go default, the kernel computes a commitment under different
generators. Cross-implementation verification silently fails at the boundary.

Brand-neutral DST sweep was advertised as comprehensive in #196 / LP-137
§2.8 ("`PEDERSEN_SEEDED_GEN_V1`, not `LUX_PEDERSEN_SEEDED_GEN_V1`") but the
default Go constructor still uses two different DSTs (`PEDERSEN_G_V1`,
`PEDERSEN_H_V1`) and the deterministic constructor still uses the old branded
DST (`LUX_PEDERSEN_*`). One algorithm, three answers — exactly the violation
LP-137 was meant to close.

Fix hint: collapse to a single DST `PEDERSEN_SEEDED_GEN_V1` with a counter
(0=G, 1..n-1=G_basis, n=H), matching `pedersen_seed.go` and the C++ side.
Delete `NewGenerators` and `DeterministicGenerators` or route them through
the seeded path.

### N4 — [HIGH] Banderwagon `MultiExpBlinded` runs blinded MSM on the same variable-time backend

`crypto/banderwagon/multiexp.go:70-127` blinds `k_i → k_i · r` and unblinds
via `r^{q-2}`, but the underlying `MultiExp` at `multiexp.go:24-38` calls
`bandersnatch.MultiExp` which is Pippenger — the same variable-time function
that motivated the blinding. The blinded scalars `k_i · r` are uniform-random
across calls, which DOES break per-call cache trace correlation (the comment
is correct), but it does NOT eliminate the leak that an adversary observing
`k_i · r` traces can derive (if they can ALSO observe `r` or another linear
combination). The construction relies on `r` being secret and unique-per-call.

Adversarial construction: side-channel attacker that can place a probe AFTER
the blinding step (e.g., correlating the trace of `r.Exp(qMinusTwo)`, line
109) recovers `r`, then cancels: the residual trace from the MSM yields
`k_i`. The Fermat-ladder for `r^{q-2}` is constant-iteration but NOT constant
time on individual square+mul (gnark `Element.Exp` is regular-form ladder over
the bit-pattern of `q-2`, which is a public constant — that's fine — but the
Mul argument `r` is secret).

The `crypto/ipa/ipa/prover.go:113,117,122,126` sites all use this. Witness
halves a_L/a_R are secret; if the adversary can collect ~10^4 IPA proofs and
average traces (real attack budget for a TEE-resident prover), key recovery
becomes plausible. The `prover_blinding_test.go:149-195` "TestTimingVariance"
test only measures macroscopic timing variance, not microarchitectural side
channels — it cannot detect this.

Fix hint: route through a constant-time MSM (e.g., regular wNAF with fixed
window, no precomputed-table lookups indexed by secret bits), or move the
prover into a CPU enclave with strict cache partitioning. The blinding helps
but does not close the channel; documenting it as "the trace observed by an
attacker depends on (k_i · r) where r is fresh per call" is true but not
sufficient — that's where the trace ENDS UP, not where the SECRET STARTS.

### N5 — [HIGH] `bn254` Metal `g1_to_affine` and `g1_double` retain secret-dependent branches; the constant-time guarantee is partial

`luxcpp/crypto/bn254/gpu/metal/bn254.metal:284-303` `g1_to_affine` has
`if (fp256_is_zero(p.z)) { ...return...; }` — secret-dependent control flow
on the Z coordinate. `g1_double` at `bn254.metal:306-309` does the same:
`if (fp256_is_zero(p.z)) return p;`. `pt_cmov` is correctly applied to the
add/scalar-mul dispatch (lines 335-415) — that's the win advertised in #192.
But `g1_double` is called from the very first iteration of `g1_scalar_mul`
and on every base doubling at line 411, AND `g1_to_affine` is called on the
public output (line 468, 507, 544).

For the scalar-mul body: `g1_double(base)` is ALWAYS called regardless of
the bit; `pt_cmov(acc, sum, mask)` selects whether to take the add. If the
running base is the identity at any point during the ladder (it can't on
non-zero scalars, but the analysis must hold for all inputs), `g1_double`'s
early-exit branches. For `g1_to_affine` on the public output, the public
result CAN be the identity (Pedersen commit of zero with zero blinding =
identity); the branch reveals "result was identity" via timing. That's a
correctness fact about the input, not the secret blinding — but it leaks
"was the secret the all-zero vector" which is a non-zero advantage.

Worse: the audit claim in #192 says "constant-time properties hold AT THE
METAL ASSEMBLY level". I can't read MSL→AIR→Apple-GPU-ISA from this audit
session without a Metal toolchain, but I CAN read the source. The MSL source
has at least 4 secret-dependent branches that the compiler is free to lower
to predicated mov OR conditional branch depending on optimizer heuristics. A
timing-stable claim at the GPU-ISA level requires a disassembly check
(`metal-objdump --disassemble`), and I see no CI evidence of that.

Fix hint: replace `if (fp256_is_zero(p.z)) ... return ...` in `g1_double`
and `g1_to_affine` with `pt_cmov`-driven masked output. For Pedersen the
output may be identity; document that and ensure the verify path doesn't
branch on it. Add a `metal-objdump` step to CI that asserts no `cmpsel.cond`
or branch on register holding `p.z` limbs.

## Top 5 NEW design weaknesses

### D1 — [HIGH] CompositeAttestation interface vs envelope is a dual-type problem

The release gate consumes a `CompositeAttestation` *interface*
(`pkg/kms/release.go:59`) and the wire layer produces a `CompositeAttestation`
*struct* (`pkg/attestation/composite.go:134`). Different files, same name,
unrelated method sets. A fix for N1 must NOT just swap types — the wire
struct doesn't have `Verify(nonce)`/`TEEPublicKey()`, and the gate interface
doesn't have `VerifyEvidence`. This invites a future regression where
someone "implements both" and gets the worst of both.

Fix: collapse to one type. The wire struct should grow `VerifyAndPolicy(ctx,
nonce, policy) (*VerifiedRelease, error)` and the gate should consume that.

### D2 — [HIGH] `require_*` flags advertised but missing from Go side

LP-137.md §2.7:312-315 claims "explicit `require_sev_snp`, `require_tdx`,
`require_nv_nras` booleans on the `CompositeAttestationConfig` struct. Zero-
byte fields no longer wildcard." Searching across `lux/*.go` for any of
`require_sev_snp`, `require_tdx`, `require_nv_nras`, `RequireSEVSNP`,
`RequireTDX`, `RequireNVNRAS` returns zero matches. The field names exist
only in C++ headers. The Go release-policy struct
(`pkg/kms/release.go:85-103`) has only `RequiredRIM` and `AllowedHardware`
maps — no per-issuer-kind require booleans. O5 closure is C++ only;
Go side is unchanged.

### D3 — [MEDIUM] WGSL Miller loop is deferred but advertised as shipped

`luxcpp/crypto/bn254/gpu/wgsl/bn254.wgsl:797-804` explicitly says
"k_miller_iter and k_pairing on WGSL: deferred. The full Miller loop on WGSL
with u64 emulation is ~2 KLOC and exceeds the per-session budget for this
commit. The host-driver fallback path runs the CPU oracle so the determinism
harness still asserts byte-equality of cyclotomic-square^100 / e(P,Q)
against the CPU oracle, exercising the wire format end-to-end."

The CHANGELOG narrative for #228 (the WGSL Miller) implies it shipped. It
did not. The "byte-equality" the harness checks is CPU-vs-CPU because the
WGSL fallback IS the CPU oracle. This is the exact O1/O3 violation LP-137
§1 calls out as the worst-case oracle bypass.

### D4 — [MEDIUM] `SetBytesLE` mutates caller's buffer

`crypto/ipa/bandersnatch/fr/element.go:732-748` reverses `e` in place. Any
caller that retains a reference to the bytes after passing them to
`SetBytesLE` gets a corrupted buffer. The transcript usage at
`common/transcript.go:76` happens to be safe (Sum returns a fresh slice),
but `common/common.go:46` (`SetBytesLECanonical(x)` where `x` is a 32-byte
read buffer) silently corrupts a buffer the caller may want to log/audit.
A future caller that passes a slice into a `[32]byte` array's underlying
storage will get a heisenbug.

Fix hint: copy then reverse, or write a new endian-flip-and-set primitive
that doesn't mutate.

### D5 — [MEDIUM] Re-publication CHANGELOG conflates implementation date with provenance

`luxcpp/crypto/CHANGELOG.md:5` "All work was completed by 2025-12-25, then
re-published in April 2026 from memory and audit recovery after a laptop-
theft data-loss event. Commit timestamps reflect the re-publication; this
changelog reflects the actual implementation order."

Cryptographically material: a reviewer reading commit hashes
`43aae365adf1f84dab00d55f26d9a6b49777f889` (line 13) and matching them to
the December 2025 narrative at line 9 cannot verify the claim — no signed
manifest of pre-theft tree hashes, no PGP-signed witness from a third party.
This narrative is a trust assertion, not a verification. For a spec that
*relies* on byte-equality KAT vectors being adversarially generated, the
"recovered from memory" provenance is a yellow flag: were the December
KATs fabricated post-hoc to match the recovered code? No way to tell.

Fix hint: stop conflating. Either (a) say "the work was completed in April
2026" and accept the late date, or (b) attest the December timeline with a
notarized manifest of pre-theft commit hashes, even if the trees are gone.
Half-claims weaken both.

## Top 5 NEW oracle bypasses

### O-N1 — [HIGH] Pedersen Metal kernel comparison is host-supplied G,H, not derived from DST

`bn254.metal:438-463` accepts G,H as host-supplied 8-limb buffers
(buffer(2)/buffer(3)). The kernel cannot independently verify these were
derived from the DST. An adversary with host code-injection authority can
supply G,H with a known discrete-log relation; the kernel computes a valid
commitment that no longer hides. The "fix" in #192 ("Host MUST derive G,H
independently via bn254 hash-to-curve with brand-neutral DSTs") is a
README-level constraint, not a kernel-level invariant. The KAT harness
cannot detect host-side DST substitution because the harness IS the host.

### O-N2 — [HIGH] WGSL pairing self-comparison

See D3. Byte-equality test for `e(P,Q)` and `cyclotomic_sqr^100` on WGSL is
CPU-against-CPU. Any CPU pairing bug passes silently. Adversary writes any
P,Q producing a CPU bug → KAT generates new "expected" → test passes →
production GPU runs CPU fallback → bug ships.

### O-N3 — [MEDIUM] Second-oracle KAT for bn254/banderwagon does not cover Miller / pairing

LP-137 §317-322 advertises `kat-second-oracle-2026-04-28` with arkworks
cross-verification for bn254 + banderwagon. I confirmed bn254 has CUDA
final-exp via Fuentes-Castaneda (`bn254_pairing.cuh:811`) and CPU at
`bn254_pairing.cpp:581`. I see no second-oracle KAT for the pairing path
itself — only the CPU implements Miller, and gnark/arkworks both have
shared upstream lineage in lots of curve code. This is the "same family"
failure LP-137 §1 is built to prevent. The CHANGELOG narrative does not
distinguish what the second oracle covers.

### O-N4 — [MEDIUM] NRAS JWS dispatch enforces alg×key but allows ES256K substitution silently

`mpc/pkg/attestation/nvidia/nras_client.go:319-387`: dispatch covers
`EdDSA`, `ES256`, `ES384`, `PS256`, `PS384`, `none`, default. NOT covered:
`ES256K` (secp256k1), `RS256` (RSASSA-PKCS1-v1_5), `EdDSA` over Ed448.
An NRAS server (or MITM with a forged trust root upload) presenting
`alg=ES256K` with a secp256k1 trust root falls into `default → ErrUnknownAlg`
— good for that case. But `RS256` falls into `default` too, yet RFC 7518
§3.1 mandates RS256 as widely-deployed; refusing it might break
compatibility AND the dispatch comment claims comprehensive defense. It's
either complete (then the comment is correct) or it isn't (then the comment
is misleading). Audit for which.

### O-N5 — [MEDIUM] NRAS nonce comparison double-negates and allows non-32-byte non-error path

`nras_client.go:204-207`:
```
jn, derr := hex.DecodeString(strings.TrimPrefix(jwtClaims.Nonce, "0x"))
if derr != nil || len(jn) != 32 || sha256BytesEqual(jn, nonce[:]) == false {
    return nil, ErrNRASNonceMismatch
}
```

If `jwtClaims.Nonce == ""` (empty) the outer guard at `:203` skips entirely —
no nonce binding enforced. NRAS server can omit the nonce claim and the gate
proceeds. The defense relies on "NRAS will always include nonce" which is a
trust-the-issuer assumption. Combined with N1 (release gate doesn't call
this code path anyway) the practical exploit is moot, but conceptually the
empty-nonce silent-skip is a bypass.

Fix: require non-empty `jwtClaims.Nonce` when the request supplied one;
empty token nonce → `ErrNRASNonceMismatch`.

## Status of prior audit findings

| ID | Finding | Status | Why |
|----|---------|--------|-----|
| **B1** | wrong import path `luxfi/fhe/threshold` | RESOLVED | one-line fix landed; not seen in current tree |
| **B2** | CDS noise-proof gap (`PartyKeys=nil` public-key fallback) | PARTIALLY | "real fixtures" added but the structural fallback path still requires audit; not re-tested in this round |
| **B3** | blake3 `test_vectors.json` missing | RESOLVED | not flagged by any test invocation in this session |
| **B4** | C-ABI returns `CRYPTO_ERR_NOTIMPL` while wins claimed | RESOLVED | spot-checked; concrete bodies present |
| **B5** | `lux/fhe/policy/` fabrication | OPEN-WHY | claims retracted in LP-137.md but the production caller `mpc/pkg/mpc/tfhe_session.go:154` still routes through `tfhe.NewKeyGenerator` whose `guardUnsafe()` panics. The retraction is documentary; the call site is live. See N2. |
| **F1** | `luxgpu` org missing | RESOLVED (organizational) | org created |
| **F2** | `lux/accel` placement | RESOLVED | stays at luxfi/accel |
| **F3** | `lux/mpc` HEAD detached | RESOLVED | clean main; `kms-nonce-bind` merged |
| **F4** | `luxcpp/consensus` no remote | RESOLVED (documented) | scaffold |
| **F5** | `luxcpp/cli` not a repo | RESOLVED (decision) | CLI lives at `lux/cli` |
| **O1/O3** | Oracle bypass (same-family CPU+oracle) | PARTIALLY | second-oracle landed for hashes/EC; pairing/Miller still self-compares (O-N3, D3) |
| **O2/O4** | KAT determinism without adversarial-distance | PARTIALLY | bn254+banderwagon got arkworks; Miller/pairing did not (D3) |
| **O5** | wildcards-on-zero in `CompositeAttestationConfig` | PARTIALLY | C++ has `require_*`; Go side does not (D2) |

## Verdict

**DO-NOT-SHIP-UNTIL** the following are addressed:

1. **N1 (CRITICAL)**: Wire `attestation.CompositeAttestation.VerifyEvidence`
   into the KMS release gate. Without this, the SEV-SNP chain verify, AMD
   KDS lookup, VCEK validation in #222 are decorative.
2. **N2 (CRITICAL)**: Either delete the call sites in
   `mpc/pkg/mpc/tfhe_session.go` (kill the production fake-threshold path
   completely) or gate the API endpoint to refuse `kind=tfhe` until real
   threshold lattice MPC ships.
3. **N3 (HIGH)**: Collapse Pedersen DST to one canonical
   `PEDERSEN_SEEDED_GEN_V1`. `pedersen.go:50,54,84,90` must be deleted or
   rewritten.
4. **D2 (HIGH)**: Add `RequireSEVSNP`, `RequireTDX`, `RequireNVNRAS` (or
   equivalents) to the Go release policy and refuse Release() unless
   required issuers produced non-nil VerifiedReports.
5. **N5 (HIGH)**: replace secret-dependent `if` in `g1_double`/`g1_to_affine`
   with `pt_cmov`-masked output, or document the residual leak and accept it.

After fixes: re-review N1/N2/N3/D2/N5 plus regression on the second-oracle
KAT generation if Pedersen DST changes (existing KATs become stale).

## Blue Handoff

What Blue got right:
- KMS release nonce HMAC-binding (`pkg/kms/release.go:272-287`) is
  correctly constructed: domain string + epoch + jobID + 32 random bytes,
  HMAC-SHA256 under rootKey. Persisted via `DatabaseNonceStore`. Survives
  restart. AAD on the sealed key includes IssuedNonce (release.go:147-156).
  This part of #193+#207 is solid.
- NRAS JWS dispatch (`nras_client.go:319-387`) correctly enforces
  alg↔key-type binding. ES256/P-256, ES384/P-384, EdDSA/Ed25519,
  PS256/PS384/RSA. `none/None/NONE/""` all rejected at line 381. F3
  closure verified.
- TFHE `guardUnsafe` panic guards are present at every entry point
  (`tfhe.go:179,282,410`; `committee.go:284`).
- SEV-SNP path uses go-sev-guest v0.14.1 with full chain verify
  (`mpc/cc/attest/sev.go:80-94`). When called, it works.

What Blue missed:
- The integration seam between `pkg/attestation/composite.go` and
  `pkg/kms/release.go`. Two unrelated `CompositeAttestation` types.
- The TFHE production caller is still live and will panic OR run unsafe.
- Pedersen Go default constructors don't use the canonical DST.
- Banderwagon `MultiExpBlinded` documents the leak it does not close.
- Metal `g1_double`/`g1_to_affine` have residual secret-dependent
  branches.
- WGSL pairing is CPU fallback, not a kernel; second-oracle for pairing
  doesn't exist.
- Go side is missing `require_*` policy flags.

Fix priority for Blue:
1. N1 (release-gate / VerifyEvidence wiring)
2. N2 (kill TFHE production call sites)
3. N3 (Pedersen DST collapse)
4. D2 (Go-side `require_*` flags)
5. N5 (Metal constant-time residuals)

Re-review scope:
- `pkg/kms/release.go` after VerifyEvidence integration
- `pkg/attestation/composite.go::VerifyEvidence` callers
- Pedersen test KATs after DST change (regenerate everything)
- Metal kernel constant-time disassembly via `metal-objdump`
- WGSL Miller / pairing kernel landing

---

RED COMPLETE. Findings ready for Blue.
Total: 2 critical, 7 high, 6 medium, 0 low, 0 info
Top 3 for Blue to fix:
1. N1 — KMS release gate doesn't call VerifyEvidence (cc/attest dead code)
2. N2 — TFHE production keygen panics or runs unsafe-fake-threshold
3. N3 — Pedersen Go default DSTs disagree with C++/GPU canonical
Re-review needed: yes — full re-test after fixes; KAT regeneration on Pedersen
Recommendation: do-not-ship-until N1+N2+N3+D2+N5 resolved
