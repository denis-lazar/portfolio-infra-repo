# Deep Dive: Security Scanning with Bandit & Trivy

This document provides a technical overview of the security testing suite integrated into the MenuSync ecosystem. We employ a multi-layered security approach using **Bandit** for static application security testing (SAST) and **Trivy** for container and supply chain security.

---

## 🐍 Bandit: Python Security Linter

### What is it?
Bandit is a tool designed to find common security issues in Python code. It processes each file, builds an Abstract Syntax Tree (AST) from it, and runs appropriate plugins against the AST nodes.

### Why we use it in MenuSync:
In the `backend/` service, Bandit helps us identify:
- **Insecure Function Calls:** Detects use of dangerous functions like `os.system`, `subprocess.Popen` with `shell=True`, or `pickle.load`.
- **Hardcoded Credentials:** Scans for strings that look like API keys, passwords, or tokens.
- **Weak Cryptography:** Identifies usage of broken hashing algorithms (MD5, SHA1) or weak SSL/TLS configurations.
- **Injection Risks:** Flags SQL injection or Command injection patterns.

### Pipeline Integration:
The Jenkins pipeline executes Bandit during the "Test & Scan" stage. Any high-severity finding will cause the build to fail, preventing insecure code from reaching the ECR repository.

---

## 🛡️ Trivy: The All-in-One Security Scanner

### What is it?
Trivy is a comprehensive security scanner for cloud-native applications. It is incredibly versatile, covering several domains of the MenuSync infrastructure.

### Why we use it in MenuSync:

#### 1. Vulnerability Scanning (OS & Language)
Trivy scans our **Docker images** and **`requirements.txt`** for known vulnerabilities (CVEs).
- It checks the Debian/Alpine base images for outdated system libraries.
- It checks our Python packages for known security flaws.

#### 2. Infrastructure as Code (IaC) Scanning
We use Trivy to scan our **Terraform** and **Kubernetes manifests**.
- **Terraform:** Detects misconfigured AWS Security Groups (e.g., port 22 open to 0.0.0.0/0).
- **Kubernetes:** Identifies pods running as root or without resource limits.

#### 3. Secret Detection
Trivy scans the entire filesystem for sensitive information that might have been accidentally committed, such as private keys or environment variables.

---

## 🛠️ Configuration & Management

### Handling False Positives
Security scanners can sometimes flag code that is intentionally written a certain way for specific reasons. We manage this through:

- **`.trivyignore`**: Used to acknowledge and skip specific CVEs or misconfigurations that have been manually audited and deemed safe or mitigated.
- **Bandit Pragmas**: Using `# nosec` comments on specific lines of Python code to tell Bandit that the line is safe.

### Security Gates in CI/CD
Our CI/CD pipeline (Jenkins) is configured with "Security Gates":
- **Low/Medium Findings:** Permitted but logged for review.
- **High/Critical Findings:** Automatically block the deployment pipeline.

---
**Author:** Den
**Last Update:** February 2026
