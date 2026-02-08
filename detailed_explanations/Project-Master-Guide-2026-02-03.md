# MenuSync: The Definitive Infrastructure & Engineering Master Guide
**Last Updated:** Tuesday, February 3, 2026
**Current Status:** Production-Ready Cluster | Full Observability | Secured Pipeline

---

## 1. Project Current State: An Overview
As of February 3, 2026, the MenuSync project has transitioned from a localized application into a fully distributed, cloud-native ecosystem. The infrastructure is currently running on **Amazon EKS (Elastic Kubernetes Service)**, managed via **Terraform** for the cloud layer and **ArgoCD** for the application layer.

The project successfully handles real-time menu updates via **WebSockets**, stores persistent restaurant data in a **MongoDB ReplicaSet**, and utilizes **Redis** for distributed messaging. The entire stack is wrapped in a sophisticated **Observability Layer (EFK + Prometheus)** and a **Secure CI/CD Pipeline (Jenkins)**.

---

## 2. The Technological Stack (The "What")

### **2.1 Core Infrastructure**
*   **Cloud Provider:** AWS (Amazon Web Services).
*   **Infrastructure as Code (IaC):** Terraform (v1.5+).
*   **Container Orchestration:** Amazon EKS (Kubernetes v1.31+).
*   **Registry:** Amazon ECR (Elastic Container Registry).
*   **Secret Management:** AWS Secrets Manager + Kubernetes Secrets.

### **2.2 Networking & Connectivity**
*   **Load Balancing:** AWS Network Load Balancer (NLB) with Cross-AZ support.
*   **Ingress Gateway:** F5 NGINX Inc. Ingress Controller (v3.6+).
*   **DNS:** dynv6 Dynamic DNS.
*   **Encryption:** Let's Encrypt (managed by cert-manager).

### **2.3 Data & Backend**
*   **Application Framework:** FastAPI (Python 3.12).
*   **Frontend Library:** React (TypeScript + Vite).
*   **Primary Database:** MongoDB 7.0 (Bitnami ReplicaSet configuration).
*   **Message Broker:** Redis 7.4 (Standalone, used for Pub/Sub WebSockets).

### **2.4 Observability (The Eye of the System)**
*   **Logging (EFK):**
    *   **Elasticsearch (v7.17.3):** Distributed search engine for log storage.
    *   **Fluent Bit (v1.9.9):** High-performance log forwarder.
    *   **Kibana (v7.17.3):** Data visualization and search interface.
*   **Monitoring (Prometheus Stack):**
    *   **Prometheus Operator:** Automated scraping and management.
    *   **Grafana (v10.3):** Real-time metrics dashboarding.
    *   **Alertmanager:** Incident notification system.

### **2.5 CI/CD & GitOps**
*   **Orchestrator:** Jenkins.
*   **Automation Logic:** Jenkins Shared Libraries & Scripted Pipelines.
*   **Deployment Controller:** ArgoCD (App-of-Apps pattern).
*   **Security Scanning:** AWS ECR Native Image Scanning.

---

## 3. Architectural Implementation (The "How")

### **3.1 The Infrastructure-as-Code (IaC) Flow**
1.  **Terraform Initialization:** Provisions the VPC, Subnets (Public/Private), and IAM Roles.
2.  **EKS Provisioning:** Creates the Control Plane and a Managed Node Group of `t3a.medium` instances.
3.  **Secret Injection:** Terraform fetches JSON secrets from **AWS Secrets Manager** and maps them to `kubernetes_secret` resources across the `argocd`, `menusync-app`, and `menusync-monitoring` namespaces.
4.  **Bootstrap:** Installs ArgoCD via a Helm Release to start the GitOps engine.

### **3.2 The Traffic Data Flow (North-South)**
1.  **Entry:** A user hits `https://menusync.dynv6.net`.
2.  **NLB:** AWS NLB receives the traffic on port 443 and forwards it to the NGINX Ingress pods.
3.  **TLS Termination:** The F5 NGINX Ingress Controller uses the `menusync-crt` secret (issued by Let's Encrypt) to decrypt the traffic.
4.  **Routing:** Based on the Host header, NGINX routes the request to the `menusync-app` Service on port 8000.
5.  **Application:** The FastAPI pod processes the request, interacting with MongoDB or Redis as needed.

### **3.3 The Logging Data Flow (East-West)**
1.  **Capture:** Fluent Bit pods (DaemonSet) tail log files in `/var/log/containers/*.log`.
2.  **Enrichment:** The `kubernetes` filter contacts the K8s API to add Pod Name, Namespace, and Labels to the log line.
3.  **Transformation:** A `rewrite_tag` filter categorizes the logs based on the namespace (e.g., `menusync-app` logs are tagged as `app.menusync`).
4.  **Storage:** Fluent Bit sends the structured JSON to the Elasticsearch Service.
5.  **Visualization:** Users access Kibana, which queries Elasticsearch to display logs in the "Discover" tab.

---

## 4. War Stories: Issues Faced & Technical Fixes

### **4.1 The Ingress Controller Collision**
*   **Issue:** The F5 Ingress pods were crashing with an error: *"IngressClass with name nginx has an invalid Spec.Controller"*.
*   **Root Cause:** The cluster had residues of the community NGINX controller, which was competing for the `nginx` class name.
*   **The Fix:** We created a unique IngressClass named **`nginx-f5`** specifically for the F5 controller and updated all Ingress manifests to use this new class.

### **4.2 The "Fake Certificate" Stalemate**
*   **Issue:** Websites were showing security warnings because they were using `cert-manager.local` self-signed certificates.
*   **Root Cause:** The HTTP-01 challenge was failing because the Ingress was redirecting all HTTP requests to HTTPS before the certificate was ready.
*   **The Fix:** 
    1.  Added the `acme.cert-manager.io/http01-edit-in-place: "true"` annotation.
    2.  Temporarily disabled `redirect-to-https: "true"`.
    3.  Reset the Certificate resources to trigger a fresh challenge.
    4.  Once Let's Encrypt issued the real cert, we re-enabled the redirect.

### **4.3 The Memory Wall (Elasticsearch OOM)**
*   **Issue:** Elasticsearch pods were stuck in `Pending` due to `Insufficient memory`.
*   **Root Cause:** Default Helm values requested 2.2Gi of RAM, which the `t3a.medium` nodes (4GB total) couldn't provide after system overhead.
*   **The Fix:** 
    1.  Reduced `ResourceRequests` to `512Mi`.
    2.  Tuned JVM Heap settings: `esJavaOpts: "-Xmx512m -Xms512m"`.
    3.  Modified the readiness probe to accept `YELLOW` status, as single-node clusters never reach `GREEN`.

### **4.4 Missing Metadata in Kibana**
*   **Issue:** Logs in Kibana lacked fields like `kubernetes.pod_name`.
*   **Root Cause:** Fluent Bit tagging was non-standard (`menusync.app`), which prevented the `kubernetes` filter from identifying the source files.
*   **The Fix:** Standardized tags to the **`kube.*`** prefix. This allowed the filter to parse the metadata from the internal file path structure.

---

## 5. Implemented Good Practices (The "Current Wins")

1.  **Secret Decoupling:** No sensitive data is stored in the Git repository. We use a secure chain from AWS Secrets Manager -> Terraform -> Kubernetes Secrets.
2.  **GitOps (App-of-Apps):** Every piece of infrastructure is defined in Git. ArgoCD manages the dependencies (Waves) to ensure networking is up before logging starts.
3.  **VPC Isolation:** Worker nodes are in private subnets. They communicate with the internet only through a NAT Gateway, preventing direct attacks.
4.  **Automated Versioning:** The Jenkins pipeline calculates the next semantic version (`1.0.x`) automatically based on Git and ECR tags.
5.  **Infrastructure Tagging:** All AWS resources are tagged with `workspace_tag`, making cost tracking and resource identification easy.
6.  **Readiness/Liveness Probes:** All core services (FastAPI, MongoDB, Elasticsearch) have health checks to enable Kubernetes self-healing.

---

## 6. Future Roadmap: Recommended Good Practices to Add

### **6.1 High Availability (HA) Upgrades**
*   **Elasticsearch Scaling:** Currently a single point of failure. Recommend a 3-node cluster on `t3a.large` nodes to achieve `GREEN` health.
*   **Multi-AZ Database:** MongoDB should be spread across three availability zones using node affinity to survive a zone outage.

### **6.2 Security Hardening**
*   **X-Pack Security:** Enable Elasticsearch authentication. Currently, the logging data is open to anyone inside the cluster.
*   **NetworkPolicies:** Implement K8s NetworkPolicies to restrict traffic between namespaces (e.g., only the App namespace should talk to the Database namespace).
*   **RBAC Auditing:** Audit ArgoCD and Jenkins permissions to follow the "Principle of Least Privilege."

### **6.3 Observability Maturity**
*   **Tracing:** Implement **Jaeger** or **OpenTelemetry** in the FastAPI backend to track requests as they move from NGINX to App to DB.
*   **Alerting Integration:** Connect Alertmanager to Slack or PagerDuty to receive instant notifications when pods restart or memory is low.
*   **Dashboarding:** Create a custom Grafana dashboard that correlates NGINX response times with Backend CPU usage.

---

## 7. Port Mapping & API Reference

| Service | Protocol | Internal Port | External Host |
| :--- | :--- | :--- | :--- |
| **ArgoCD Server** | HTTP | 80 | `argocd-menusync.dynv6.net` |
| **Menusync API** | HTTP | 8000 | `menusync.dynv6.net` |
| **Kibana UI** | HTTP | 5601 | `menusync-kibana.dynv6.net` |
| **Grafana UI** | HTTP | 3000 | `menusync-grafana.dynv6.net` |
| **Elasticsearch** | HTTP | 9200 | `elasticsearch-master` (Internal only) |
| **MongoDB** | TCP | 27017 | `menusync-app-mongodb` (Internal only) |

---

## 8. Summary of Today's Impact
By decoupling the logging and monitoring stacks and switching to enterprise-grade controllers (F5), the MenuSync project is now significantly more stable and debuggable. The resolution of the certificate redirect loops and the memory tuning of Elasticsearch ensures that the developer experience is seamless while keeping AWS costs optimized.

---
**Report generated by Gemini CLI Agent.**
**Execution Time:** 2026-02-03 23:00 UTC
**Cluster Health:** NOMINAL
**Infrastructure State:** STABLE
