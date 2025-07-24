# LP Editors Guide

This document outlines the responsibilities, processes, and guidelines for LP Editors who maintain the Lux Improvement Proposals repository.

## Role of LP Editors

LP Editors are responsible for:
- Managing the LP repository
- Guiding authors through the process
- Ensuring quality and consistency
- Facilitating community discussion
- Making editorial decisions

### What Editors Do

✅ **Administrative Tasks**
- Assign LP numbers
- Merge formatting PRs
- Update proposal statuses
- Maintain documentation
- Track progress

✅ **Quality Control**
- Check formatting compliance
- Ensure completeness
- Verify technical accuracy
- Review security considerations
- Validate references

✅ **Community Support**
- Guide new authors
- Facilitate discussions
- Resolve conflicts
- Answer questions
- Connect stakeholders

### What Editors Don't Do

❌ **Not Responsible For**
- Judging technical merit
- Making implementation decisions
- Approving/rejecting based on opinion
- Writing proposals for others
- Implementing standards

## Editorial Process

### 1. New Proposal Review

When a new LP is submitted:

```markdown
## New LP Checklist
- [ ] Formatting follows template
- [ ] All required sections present
- [ ] Abstract is clear (200 words)
- [ ] Motivation well explained
- [ ] Technical spec complete
- [ ] Security section included
- [ ] Backwards compatibility addressed
- [ ] Proper YAML frontmatter
- [ ] References valid
- [ ] No duplicate proposals
```

### 2. Number Assignment

Follow these steps:
1. Check [NUMBER-ALLOCATION.md](./NUMBER-ALLOCATION.md)
2. Verify no conflicts
3. Assign appropriate number
4. Update allocation registry
5. Rename file to `lip-N.md`

### 3. Status Updates

Editors update status when:
- Author requests with justification
- Milestones are reached
- Time limits expire
- Implementation complete

Status flow:
```
Draft → Review → Last Call → Final
  ↓        ↓         ↓
Withdrawn  Rejected  Stagnant
```

### 4. Editorial Standards

#### Language & Style
- Clear, concise technical writing
- American English spelling
- Active voice preferred
- No marketing language
- Objective tone

#### Technical Accuracy
- Verify code examples compile
- Check mathematical formulas
- Validate external links
- Ensure consistency
- Review for errors

#### Formatting Requirements
- Markdown compliance
- Proper heading hierarchy
- Code block syntax highlighting
- Table formatting
- Image optimization

## Editor Workflows

### Daily Tasks
```bash
# Check new PRs
gh pr list --label "new-lip"

# Review discussions
gh issue list --label "editor-review"

# Update statuses
./scripts/update-statuses.sh
```

### Weekly Tasks
- Review stagnant proposals
- Update index files
- Clean up closed PRs
- Respond to author queries
- Team sync meeting

### Monthly Tasks
- Update allocation registry
- Archive withdrawn LPs
- Review editor guidelines
- Community report
- Process improvements

## Decision Guidelines

### When to Merge

✅ **Merge When:**
- All formatting correct
- Content complete
- Author responsive
- No blocking issues
- Proper number assigned

### When to Request Changes

🔧 **Request Changes For:**
- Missing sections
- Formatting errors
- Unclear specifications
- Invalid references
- Security concerns

### When to Reject

❌ **Reject Only When:**
- Duplicate of existing LP
- Out of scope completely
- Author unresponsive (>30 days)
- Spam or inappropriate
- Violates code of conduct

## Communication Templates

### New Author Welcome
```markdown
Welcome to the LP process! I'm [Name], one of the LP editors.

I've reviewed your submission and have the following feedback:
[Specific feedback points]

Please address these items and update your PR. If you have questions, 
feel free to ask here or in our Discord #lip-help channel.

Looking forward to your revisions!
```

### Status Update
```markdown
## Status Update: LP-[N] moving to [Status]

This LP has met the criteria for [Status]:
- [Criteria 1]
- [Criteria 2]
- [Criteria 3]

The status has been updated. Next steps:
[Next steps for author]

Congratulations on the progress!
```

### Stagnant Notice
```markdown
## Notice: LP-[N] Marked as Stagnant

This LP has had no activity for 60 days. As per our process, 
it has been marked as Stagnant.

To reactivate:
1. Address outstanding feedback
2. Update the proposal
3. Request status change

The LP will be withdrawn after 90 days of inactivity.
```

## Tools for Editors

### Automation Scripts

```bash
# scripts/validate-lip.sh
#!/bin/bash
# Validates LP formatting and structure

# scripts/assign-number.sh
#!/bin/bash  
# Assigns next available LP number

# scripts/update-index.sh
#!/bin/bash
# Updates index files automatically

# scripts/check-links.sh
#!/bin/bash
# Validates all external links
```

### Editor Dashboard

Access the editor dashboard for:
- PR queue management
- Status tracking
- Author communications
- Deadline monitoring
- Statistics

## Quality Standards

### Review Checklist

For each review, ensure:

**Structure**
- [ ] Follows template exactly
- [ ] Sections in correct order
- [ ] Proper heading levels
- [ ] Valid YAML frontmatter

**Content**
- [ ] Abstract summarizes well
- [ ] Motivation is compelling
- [ ] Specification is complete
- [ ] Examples are correct
- [ ] Security considered

**Technical**
- [ ] Code compiles/runs
- [ ] Interfaces complete
- [ ] No obvious vulnerabilities
- [ ] Gas considerations
- [ ] Error handling

**References**
- [ ] All links work
- [ ] Citations complete
- [ ] Related LPs linked
- [ ] External standards noted

## Conflict Resolution

### Author Disputes
1. Listen to all parties
2. Focus on technical merit
3. Seek additional reviewers
4. Escalate if needed
5. Document decision

### Technical Disagreements
1. Gather expert opinions
2. Request proof/examples
3. Consider precedent
4. Make editorial decision
5. Allow appeals

### Process Issues
1. Review guidelines
2. Discuss with team
3. Propose clarification
4. Update documentation
5. Communicate changes

## Editor Onboarding

### New Editor Checklist
- [ ] GitHub repository access
- [ ] Discord editor role
- [ ] Read all documentation
- [ ] Shadow senior editor
- [ ] Review 5 LPs with mentor
- [ ] Handle first LP solo
- [ ] Join editor meetings

### Required Knowledge
- Blockchain fundamentals
- Smart contract basics
- Markdown proficiency
- Git/GitHub skills
- Communication skills
- Technical writing
- Community awareness

## Best Practices

### Do's
✅ Be responsive (< 48 hours)
✅ Provide specific feedback
✅ Help authors succeed
✅ Maintain neutrality
✅ Document decisions
✅ Foster community
✅ Stay organized

### Don'ts
❌ Judge on personal preference
❌ Delay without reason
❌ Make unilateral changes
❌ Ignore author questions
❌ Skip review steps
❌ Show favoritism
❌ Break confidentiality

## Resources for Editors

### Internal Resources
- [Editor Handbook](./internal/handbook.md)
- [Decision Log](./internal/decisions.md)
- [Meeting Notes](./internal/meetings/)
- [Statistics Dashboard](./internal/stats.md)

### External Resources
- [EIP Editor Guide](https://eips.ethereum.org)
- [Technical Writing Guide](https://developers.google.com/tech-writing)
- [Markdown Guide](https://www.markdownguide.org)

### Communication Channels
- **Slack**: #lip-editors (private)
- **Discord**: Editor channels
- **Email**: editors@lux.network
- **Meetings**: Weekly Thursdays 2pm UTC

## Metrics & Reporting

### Track Monthly
- New LPs submitted
- Average review time
- Author satisfaction
- Status transitions
- Editor workload

### Success Metrics
- Review time < 1 week
- Author NPS > 8
- No valid complaints
- Growing submissions
- Quality improving

## Emergency Procedures

### Critical Issues
1. **Security vulnerability**: Immediate private disclosure
2. **Spam attack**: Temporary submission freeze
3. **Editor unavailability**: Backup assignments
4. **System failure**: Manual backup process
5. **Conflict escalation**: Executive committee

### Contact Tree
1. Lead Editor
2. Backup Lead
3. Technical Committee
4. Executive Team

---

*This guide is for LP Editors only. For public contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)*

*Last Updated: January 2025*