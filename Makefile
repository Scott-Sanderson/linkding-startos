# overrides to s9pk.mk must precede the include statement
ARCHES = x86_64 aarch64

.PHONY: ensure-host-s9pk
ensure-host-s9pk:
	@ARCH=$$(start-cli server device-info | awk -F'|' '/\|[[:space:]]*ARCH[[:space:]]*\|/ {gsub(/^[[:space:]]+|[[:space:]]+$$/, "", $$3); print $$3; exit}'); \
	case "$$ARCH" in \
		x86_64|aarch64) ;; \
		amd64) ARCH=x86_64 ;; \
		arm64) ARCH=aarch64 ;; \
		*) \
			echo "Error: could not determine supported StartOS architecture (got '$$ARCH')"; \
			exit 1; \
			;; \
	esac; \
	$(MAKE) --no-print-directory "$$ARCH"; \
	if [ ! -f "linkding_$${ARCH}.s9pk" ]; then \
		echo "Error: expected linkding_$${ARCH}.s9pk to exist after build"; \
		exit 1; \
	fi; \
	touch "linkding_$${ARCH}.s9pk"

install: ensure-host-s9pk

include s9pk.mk
