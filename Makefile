# Makefile for Lux Proposals (LPs)
# This file provides convenient shortcuts for common LP management tasks

.PHONY: help new validate check-links update-index validate-all clean permissions

# Default target - show help
help:
	@echo "Lux Proposals (LPs) Management"
	@echo "==========================================="
	@echo ""
	@echo "Available commands:"
	@echo "  make new           - Create a new LP using the interactive wizard"
	@echo "  make validate      - Validate a specific LP file (use FILE=path/to/lip.md)"
	@echo "  make validate-all  - Validate all LP files in the repository"
	@echo "  make check-links   - Check all links in LP files"
	@echo "  make update-index  - Update the LP index in README.md"
	@echo "  make stats         - Show LP statistics by status and type"
	@echo "  make permissions   - Fix script permissions (make them executable)"
	@echo "  make clean         - Clean up temporary files"
	@echo ""
	@echo "Examples:"
	@echo "  make new                              # Create a new LP"
	@echo "  make validate FILE=LPs/lp-20.md     # Validate a specific LP"
	@echo "  make validate-all                     # Validate all LPs"
	@echo ""

# Create a new LP using the interactive wizard
new:
	@echo "Starting LP creation wizard..."
	@./scripts/new-lp.sh

# Validate a specific LP file
# Usage: make validate FILE=LPs/lip-20.md
validate:
ifndef FILE
	@echo "Error: Please specify a file to validate"
	@echo "Usage: make validate FILE=path/to/lp.md"
	@echo "Example: make validate FILE=LPs/lp-20.md"
	@exit 1
else
	@echo "Validating $(FILE)..."
	@./scripts/validate-lp.sh $(FILE)
endif

# Validate all LP files
validate-all:
	@echo "Validating all LP files..."
	@for file in LPs/lp-*.md; do \
		if [ -f "$$file" ]; then \
			echo "Checking $$file..."; \
			./scripts/validate-lp.sh "$$file" || exit 1; \
		fi \
	done
	@echo "All LP files validated successfully!"

# Check all links in LP files
check-links:
	@echo "Checking all links in LP files..."
	@./scripts/check-links.sh

# Update the LP index in README.md
update-index:
	@echo "Updating LP index..."
	@python3 ./scripts/update-index.py

# Fix script permissions (make them executable)
permissions:
	@echo "Setting executable permissions on scripts..."
	@chmod +x scripts/*.sh
	@echo "Permissions updated!"

# Clean up temporary files
clean:
	@echo "Cleaning up temporary files..."
	@find . -name "*.tmp" -delete
	@find . -name "*.bak" -delete
	@find . -name ".DS_Store" -delete
	@echo "Cleanup complete!"

# Shortcut aliases
n: new
v: validate
va: validate-all
cl: check-links
ui: update-index
p: permissions

# Advanced targets for maintainers

# Run all validation checks
.PHONY: check-all
check-all: validate-all check-links
	@echo "All validation checks passed!"

# Prepare for PR submission
.PHONY: pre-pr
pre-pr: validate-all check-links update-index
	@echo "Pre-PR checks complete!"
	@echo "Your changes are ready for submission."

# Show current LP statistics
.PHONY: stats
stats:
	@echo "LP Statistics"
	@echo "=============="
	@echo "Total LPs: $$(ls -1 LPs/lp-*.md 2>/dev/null | wc -l)"
	@echo ""
	@echo "By Status:"
	@for status in Draft Review "Last Call" Final Withdrawn Deferred Superseded Stagnant; do \
		count=$$(grep -l "status: $$status" LPs/lp-*.md 2>/dev/null | wc -l); \
		printf "  %-12s %s\n" "$$status:" "$$count"; \
	done
	@echo ""
	@echo "By Type:"
	@for type in "Standards Track" Meta Informational; do \
		count=$$(grep -l "type: $$type" LPs/lp-*.md 2>/dev/null | wc -l); \
		printf "  %-12s %s\n" "$$type:" "$$count"; \
	done

# List all LPs with their titles
.PHONY: list
list:
	@echo "Current LPs:"
	@echo "============="
	@for file in LPs/lp-*.md; do \
		if [ -f "$$file" ]; then \
			lp=$$(grep "^lp:" "$$file" | cut -d' ' -f2); \
			title=$$(grep "^title:" "$$file" | cut -d' ' -f2-); \
			printf "LP-%-4s %s\n" "$$lp:" "$$title"; \
		fi \
	done

# Watch for changes and auto-validate (requires entr)
.PHONY: watch
watch:
	@command -v entr >/dev/null 2>&1 || { echo "Error: 'entr' is required but not installed. Install with: brew install entr"; exit 1; }
	@echo "Watching for changes in LPs directory..."
	@echo "Press Ctrl+C to stop"
	@find LPs -name "*.md" | entr -c make validate-all

# Create a draft from template
.PHONY: draft
draft:
	@cp LPs/TEMPLATE.md LPs/lp-draft.md
	@echo "Created LPs/lp-draft.md from template"
	@echo "Edit this file and submit as a PR to get your LP number"

# Development helpers
.PHONY: setup
setup: permissions
	@echo "Checking Python 3..."
	@command -v python3 >/dev/null 2>&1 || { echo "Warning: Python 3 is required for update-index"; }
	@echo "Setup complete!"

# Show recent changes
.PHONY: recent
recent:
	@echo "Recently modified LPs (last 10):"
	@ls -lt LPs/lp-*.md 2>/dev/null | head -10 | awk '{print $$9}'