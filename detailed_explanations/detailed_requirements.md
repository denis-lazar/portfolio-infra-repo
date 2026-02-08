# Project Requirements & Status Checklist

This document tracks the requirements for the Portfolio-v2 project (MenuSync) and assesses the current progress based on the existing codebase and `gemini.md`.

## Part 1: Core Objectives & Technology Stack

### Core Objectives
- [x] Functional SaaS application with REST API
- [x] Complete CI/CD workflow with automated testing
- [x] Infrastructure as Code (Terraform) for AWS
- [x] Kubernetes-based microservice architecture (EKS)
- [x] GitOps deployment methodology (ArgoCD)
- [x] Logging and monitoring solutions (Partially Done - Prometheus exported, Grafana dashboards pending)

### Technology Stack
- [x] **Project Management:** Trello/Jira (Assumed used)
- [x] **Source Control:** GitHub
- [x] **Backend:** Python FastAPI (Matches requirements)
- [x] **Frontend:** React + TypeScript
- [x] **Containerization:** Docker with ECR
- [x] **Database:** MongoDB
- [x] **IaC:** Terraform
- [x] **Cloud Provider:** AWS
- [x] **Orchestration:** Kubernetes (EKS)
- [x] **Package Management:** Helm (Umbrella Chart)
- [x] **CI/CD:** Jenkins
- [x] **Ingress:** Nginx Ingress Controller
- [x] **GitOps:** ArgoCD
- [ ] **Logging:** EFK or ECK (Pending)
- [ ] **Monitoring:** Prometheus & Grafana (Prometheus active, Grafana dashboards pending)

---

## Part 2: AWS Services Implementation
- [x] **Compute:** EKS, EC2 (Node groups)
- [x] **Storage:** S3 (Terraform backend), ECR (Docker images)
- [x] **Networking:** VPC, Private Subnets, Security Groups, NAT Gateway
- [x] **Security:** IAM Roles and Policies (OIDC & IRSA implemented)
- [x] **Load Balancing:** ALB/NLB via Nginx Ingress

---

## Part 3: Repository Structure & CI/CD

### Repository Structure
- [x] **Application Repository:** Code, CI/CD, Dockerfile, Tests.
- [x] **Infrastructure Repository:** Terraform (Custom modules, no 3rd party modules).
- [x] **GitOps Repository:** Helm charts, ArgoCD manifests.
- [x] **Branching Strategy:** `main` and `feature/*` branches used.

### Application Development
- [x] 150-300 lines of original core logic.
- [x] Database interaction (CRUD).
- [x] Multi-stage Dockerfile.
- [x] Docker-compose for local development.
- [x] Endpoints: `POST /person`, `PUT`, `DELETE`, `GET` (MenuSync uses Restaurant/Menu equivalents).
- [x] `GET /metrics` for Prometheus.
- [x] Application logs.

### CI/CD Pipeline (Jenkins)
- [x] Source/Build/Test/Package stages.
- [x] Integration tests in CI.
- [x] Versioning/Tagging (Main only).
- [x] Push to ECR (Main only).
- [x] Update GitOps config/image tag (Main only).
- [x] Jenkins server deployed separately (Platform-level).

---

## Part 4: Infrastructure & Operations

### Kubernetes Setup
- [x] Dedicated VPC with Private Subnets.
- [x] Terraform State management with S3.
- [x] Max 3 nodes (t3a.medium).
- [x] Helm Umbrella Chart (App + MongoDB).
- [x] App of Apps pattern in ArgoCD.
- [x] Namespaces (App, ArgoCD, etc.).
- [x] Resource Limits & Health Probes.

### Certificate Management
- [x] Cert-manager deployed via App of Apps.
- [x] TLS certificates for Ingress.

### Secrets Management
- [x] Terraform/Kubernetes Secrets (Based on `gemini.md`, OIDC/IRSA used for AWS access).

---

## Part 5: Documentation & Bonuses

### Documentation
- [x] Comprehensive READMEs for each repo.
- [ ] **AWS Infrastructure Diagram** (To be verified/created).
- [ ] **CI/CD Flow Diagram** (To be verified/created).
- [ ] **K8s Service Architecture Diagram** (To be verified/created).

### Bonus Features Checklist (by Complexity)

| Complexity | Task | Description | Status |
| :--- | :--- | :--- | :--- |
| **Low** | Proxy Gemini AI | Move API calls to backend to hide keys. | Pending |
| **Low** | HPA | Auto-scale pods based on CPU/RAM. | Pending |
| **Medium** | CloudFront / S3 | Optimize static file delivery. | Pending |
| **Medium** | Kind Cluster | Local K8s for E2E testing in CI. | Pending |
| **Medium** | Security Scanning | Trivy / Bandit / SonarQube. | Partially (ECR scan) |
| **High** | Karpenter | Advanced cluster autoscaling. | Pending |
| **High** | Multi-environment | Dev/Staging/Prod separation. | Pending |
| **High** | Terragrunt | DRY Terraform configurations. | Pending |

---

## Remaining Work Summary
1.  **Logging & Monitoring:** Finalize Grafana dashboards and implement EFK/ECK stack.
2.  **Security:** Proxy Gemini AI requests through the backend.
3.  **Testing:** Implement `kind` for local pipeline verification.
4.  **Scaling:** Expand to 3 AZs for high availability.
5.  **Diagrams:** Create the three required architecture diagrams.
