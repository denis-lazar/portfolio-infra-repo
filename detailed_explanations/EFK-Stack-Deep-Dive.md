# Deep Dive: EFK Logging Stack Configuration

This document provides a detailed breakdown of the EFK (Elasticsearch, Fluent Bit, Kibana) stack configuration used in our cluster.

## 1. High-Level Architecture
The logging stack follows a standard "Sidecar/DaemonSet" pattern:
1.  **Fluent Bit (The Collector):** Runs as a DaemonSet on every node. it tails log files from `/var/log/containers`, parses them, and sends them to Elasticsearch.
2.  **Elasticsearch (The Storage):** A distributed search engine that indexes and stores the logs.
3.  **Kibana (The UI):** A web interface to visualize and search through the logs stored in Elasticsearch.

---

## 2. Elasticsearch Configuration (`7.17.3`)

### Key Components:
- **`replicas: 1` & `minimumMasterNodes: 1`**: Since we are in a development/learning environment, we use a single node. In production, you would use 3+ nodes for high availability.
- **`esJavaOpts: "-Xmx1g -Xms1g"`**: This is critical. It sets the **JVM Heap Size**. Elasticsearch is memory-intensive. We allocate 1GB of RAM to the Java process itself.
- **`persistence.size: 10Gi`**: Allocates a persistent EBS volume. This ensures your logs aren't lost if the pod restarts.

### Redundant Settings:
- **`nodeGroup: "master"`**: In a single-node setup, the node automatically acts as master, data, and ingest. Specifying it explicitly is redundant but harmless.
- **`clusterName: "elasticsearch"`**: This is the default value.

---

## 3. Kibana Configuration (`7.17.3`)

### Key Components:
- **`elasticsearchHosts`**: Tells Kibana where to find the data. We use the internal Kubernetes DNS name (`elasticsearch-master`).
- **`ingress`**:
    - **`nginx-f5`**: We use the F5 NGINX controller.
    - **`redirect-to-https`**: Ensures all traffic is encrypted.
    - **`cert-manager`**: Automatically handles the Let's Encrypt certificate for `menusync-kibana.dynv6.net`.

---

## 4. Fluent Bit Configuration (The Pipeline)

Fluent Bit works like a factory pipeline: **Input -> Filter -> Parser -> Output**.

### A. Inputs (`tail`)
We tail specific paths to avoid "Log Noise" from system pods:
- **Menusync App**: `/var/log/containers/*_menusync-app_*.log`
- **NGINX Ingress**: Filters only the logs from the `ingress-nginx` namespace.
- **MongoDB**: Targets the database logs specifically.
- **Systemd**: Collects `kubelet` service logs from the actual host machine (useful for debugging node crashes).

### B. Parsers (`nginx_ingress`)
Logs are usually just long strings of text. The **Regex Parser** converts a raw NGINX line into structured JSON data:
- *Before:* `1.2.3.4 - - [03/Feb...] "GET / HTTP/1.1" 200...`
- *After:* `{"remote_addr": "1.2.3.4", "method": "GET", "status": 200, ...}`
This allows you to create dashboards in Kibana based on status codes or response times.

### C. Filters (`kubernetes` & `record_modifier`)
- **`kubernetes` Filter**: Enriches the logs with metadata (Pod Name, Namespace, Container ID).
- **`record_modifier`**: Adds a custom field called `es_index`. This is our "Organizer." It tells Elasticsearch which drawer to put the log in.

### D. Outputs (`es`)
Sends the data to Elasticsearch.
- **`Logstash_Format On`**: This is a standard practice. It makes Elasticsearch create a new index every day (e.g., `menusync-2026.02.03`).
- **`Logstash_Prefix`**: This defines the name of the index. We use different prefixes for App, NGINX, and DB logs so they don't get mixed up.

### Redundant Settings in Fluent Bit:
- **`logLevel: info`**: This is the default.
- **Multiple `kubernetes` filters**: We have 3 identical kubernetes filters. Technically, one filter with `Match *` or `Match kube.*` would cover everything. We keep them separate for readability, but they are redundant.
- **`Retry_Limit 5`**: While useful, Fluent Bit has a built-in retry mechanism that is usually sufficient without explicit limits in a simple setup.

---

## 5. Security Note
Currently, **X-Pack Security is disabled**. 
- **Pros:** Fast setup, no password management for internal components.
- **Cons:** Anyone inside your cluster (or anyone who finds your Kibana URL if Ingress is misconfigured) can delete your logs.
- **Fix:** We should eventually enable `elasticsearch.security.enabled` and use Kubernetes Secrets for the `elastic` user password.
