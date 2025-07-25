# Frequently Asked Questions (FAQ)

This document answers common questions about Lux Proposals (LPs) and Lux Request for Comments (LRCs).

## General Questions

### What is a LP?

A LP (Lux Proposal) is a design document that provides information to the Lux community or describes a new feature, process, or environment change for the Lux Network. It's the primary mechanism for proposing changes and documenting design decisions.

### What is an LRC?

An LRC (Lux Request for Comment) is a subcategory of Standards Track LPs focused on application-layer standards like token interfaces, wallet standards, and smart contract conventions. Every LRC is a LP, but not every LP is an LRC.

### What's the difference between LP and LRC?

- **LP**: Covers all types of proposals (governance, core protocol, networking, applications)
- **LRC**: Specifically for application-layer standards (like ERC in Ethereum)
- Think of LRC as a category within LP, similar to how ERC-20 is actually EIP-20

### Who can submit a LP?

Anyone! The LP process is open to all. You don't need special permissions, just a good idea and the willingness to see it through the process.

### How long does the LP process take?

It varies significantly:
- Simple standards: 1-3 months
- Complex protocols: 6-12 months
- Controversial changes: 12+ months

The timeline depends on complexity, community feedback, and implementation requirements.

## Process Questions

### How do I start?

1. **Research**: Check existing LPs to avoid duplicates
2. **Discuss**: Post in [GitHub Discussions](https://github.com/luxfi/lps/discussions) or Discord
3. **Draft**: Write your LP following the [template](./LPs/TEMPLATE.md)
4. **Submit**: Open a PR to the LPs repository
5. **Iterate**: Address feedback and improve

### What makes a good LP?

A good LP has:
- Clear problem statement
- Well-defined solution
- Technical specifications
- Security considerations
- Implementation plan
- Community support

### Can I update my LP after submission?

Yes! LPs can be updated:
- **Draft/Review**: Unlimited updates
- **Last Call**: Only critical fixes
- **Final**: No changes (create new LP for updates)

### What if my LP is rejected?

Rejection reasons might include:
- Duplicate of existing work
- Technical infeasibility
- Security concerns
- Lack of community support

You can:
- Address the concerns and resubmit
- Collaborate with existing similar proposals
- Refine the idea with more research

### How do I get a LP number?

LP numbers are assigned when your PR is ready to merge:
1. Submit PR with `lp-draft.md`
2. Editor reviews and assigns number
3. File renamed to `lp-N.md`
4. PR merged with assigned number

## Technical Questions

### Do I need to provide code?

Depends on the LP type:
- **Standards Track**: Reference implementation required
- **Meta**: Usually no code needed
- **Informational**: Code optional

Reference implementations help but don't need to be production-ready.

### What programming languages are accepted?

- **Smart Contracts**: Solidity (preferred), Vyper
- **Node Implementation**: Go
- **Tools/SDKs**: JavaScript/TypeScript, Python, Rust
- **Examples**: Any language with clear documentation

### How detailed should specifications be?

Specifications should be detailed enough that:
- Multiple independent implementations are possible
- No ambiguity in requirements
- Edge cases are covered
- Security considerations are clear

### Can I use external libraries?

Yes, but:
- Clearly document dependencies
- Prefer well-established libraries
- Consider security implications
- Provide fallback options

### What about gas costs?

For smart contract standards:
- Include gas estimates
- Compare with alternatives
- Optimize where possible
- Document trade-offs

## LRC-Specific Questions

### When should I create an LRC vs regular LP?

Create an LRC when your proposal:
- Defines smart contract interfaces
- Creates token standards
- Specifies wallet interactions
- Establishes dApp conventions

Use regular LP for:
- Protocol changes
- Governance updates
- Network modifications
- Process improvements

### Can I use the same number as an ERC?

Yes! We encourage it for compatibility:
- LRC-20 mirrors ERC-20
- LRC-721 mirrors ERC-721
- Helps developers transitioning from Ethereum

### Do LRCs need to be backward compatible?

Not always, but:
- Clearly state compatibility
- Provide migration paths
- Consider ecosystem impact
- Prefer extension over breaking changes

### How do I port an ERC to LRC?

1. Use the same number (e.g., ERC-20 → LRC-20)
2. Adapt for Lux-specific features
3. Add cross-chain considerations
4. Enhance with B-Chain/Z-Chain features
5. Credit original authors

## Implementation Questions

### Do I need to implement my LP?

- **Standards Track**: Reference implementation required
- **Meta/Informational**: Implementation optional
- You can collaborate with others for implementation

### Where can I get implementation help?

- Discord #dev-help channel
- GitHub Discussions
- Developer forum
- Weekly office hours
- Grants program for significant work

### How do I test my implementation?

1. Unit tests (required)
2. Integration tests (recommended)
3. Testnet deployment
4. Security audit (for financial standards)
5. Community testing period

### What about security audits?

- Required for: DeFi protocols, token standards, bridge implementations
- Recommended for: Any financial application
- Optional for: UI standards, metadata formats
- Auditor list available in Discord

## Community Questions

### How do I get community feedback?

1. Post in GitHub Discussions
2. Share in Discord #lp-discussion
3. Present at community calls
4. Write blog posts
5. Engage on social media

### What if there's disagreement?

- Focus on technical merit
- Provide data/examples
- Seek compromise
- Request mediator if needed
- Remember: rough consensus, not unanimity

### How do I find collaborators?

- Post in #looking-for-team
- Attend community calls
- Reach out to similar projects
- Use GitHub's collaboration features
- Join working groups

### Can I get funding for my LP?

Possible funding sources:
- Lux Grants Program
- Community Treasury
- Ecosystem partners
- Crowdfunding
- Bounty programs

## Status Questions

### What do the different statuses mean?

- **Draft**: Initial proposal, major changes expected
- **Review**: Ready for wide review
- **Last Call**: Final review period (14 days)
- **Final**: Accepted and implemented
- **Stagnant**: No progress for 60+ days
- **Withdrawn**: Author abandoned
- **Rejected**: Not accepted by community

### How do I move my LP forward?

1. **Draft → Review**: Address initial feedback, complete specs
2. **Review → Last Call**: Implement feedback, show community support
3. **Last Call → Final**: No unresolved issues, implementations exist

### What is "Last Call" deadline?

A 14-day period for final objections. If no critical issues arise, the LP moves to Final. Critical issues reset the deadline.

### Can a Final LP be changed?

No. Final LPs are immutable. To make changes:
1. Create a new LP
2. Reference the original
3. Explain the updates
4. May mark original as "Superseded"

## Miscellaneous Questions

### Are LPs legally binding?

No. LPs are technical standards and community agreements, not legal contracts. Implementation is voluntary based on community consensus.

### Can I submit a LP anonymously?

Yes, but:
- Still need GitHub account
- Must respond to feedback
- Consider using pseudonym
- Maintain consistent identity

### What about intellectual property?

All LPs are released under CC0 (public domain). By submitting, you agree to waive all copyright claims.

### Can I withdraw my LP?

Yes, at any stage before Final:
- Comment on the PR/issue
- State reason (optional)
- Editor updates status
- Content remains for reference

### How do I become a LP editor?

1. Demonstrate knowledge of process
2. Active community participation
3. Strong communication skills
4. Technical understanding
5. Apply when positions open

### Where can I get more help?

- **Technical**: Discord #dev-help
- **Process**: Discord #lp-help
- **General**: GitHub Discussions
- **Urgent**: editors@lux.network

---

*Can't find your answer? Ask in [Discord](https://discord.gg/lux) or [open an issue](https://github.com/luxfi/lps/issues)*

*Last Updated: January 2025*