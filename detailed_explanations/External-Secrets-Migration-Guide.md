# MenuSync: External Secrets Migration Guide

This document details the transition from **Terraform-managed secrets** to the **External Secrets Operator (ESO)** pattern. This shift enhances security by removing sensitive data from the Terraform state and enabling automatic secret synchronization.

---

## 🏗️ Technical Changes Implemented

### 1. IAM Infrastructure (`Infrastructure/modules/external-secrets`)
We implemented the **IAM Role for Service Accounts (IRSA)** pattern. This is the industry-standard method for providing AWS permissions to Kubernetes pods.
- **Trust Relationship:** The IAM Role is configured to trust only the OIDC provider of the `menusync-prod` EKS cluster.
- **Scope-Down Policy:** A custom IAM policy was created to allow only `secretsmanager:GetSecretValue` and `secretsmanager:DescribeSecret`.
- **Module Integration:** The new module is called from the root production configuration, ensuring the identity is managed as code.

### 2. GitOps Configuration (`GITOPS/apps/infra-apps/external-secrets.yaml`)
The ArgoCD manifest was updated to install the ESO Helm chart with specific overrides:
- **`installCRDs: true`**: Automatically manages the Custom Resource Definitions required by ESO.
- **Service Account Annotation**: The `external-secrets` ServiceAccount is now annotated with the IAM Role ARN created by Terraform. This "links" the Kubernetes pod to the AWS IAM identity.

---

## 🚀 Execution Roadmap

### Step 1: Provision the Identity
Run Terraform to create the new IAM Role in your AWS account.
```bash
cd Infrastructure/main-conf/prod
terraform init
terraform apply
```

### Step 2: Deploy the Operator
Push the GitOps changes to GitLab. ArgoCD will detect the new application and install the operator into the `external-sec` namespace.
```bash
cd GITOPS
git add .
git commit -m "feat: install external-secrets-operator with IRSA"
git push
```

### Step 3: Establish the Bridge (`ClusterSecretStore`)
Create a manifest that tells the operator to use the AWS Secrets Manager in `ap-south-1`.
*Action: Create `GITOPS/apps-config/external-secrets/secret-store.yaml`*
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secretsmanager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-south-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets
            namespace: external-sec
```

### Step 4: Map the Secrets (`ExternalSecret`)
Create mappings for MongoDB and Redis. This replaces the `kubernetes_secret` resources in Terraform.
*Action: Create `GITOPS/apps-config/external-secrets/app-secrets.yaml`*
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: menusync-db-secret
  namespace: menusync-app
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: menusync-app-secret # Name expected by the app
  data:
  - secretKey: password
    remoteRef:
      key: mongo-secrets
      property: mongodb-user-password
```

---

## ✅ Final Result
- **Terraform State:** Will no longer contain `mongodb-user-password` values in plain text.
- **GitOps:** Secrets are defined by **reference**, not by **value**.
- **Automation:** Changing a password in the AWS Console will automatically update the cluster within 1 hour (or manually forced).
