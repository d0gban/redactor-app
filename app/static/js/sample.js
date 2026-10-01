// Demo prompt shown by "Load sample". Every value here is fake.
export const SAMPLE_PROMPT = `Hi! Can you help me debug our onboarding service? Context below.

Analyst: Juan Dela Cruz (juan.delacruz@dogban.ai, +63 917 123 4567)
Backup contact: maria.santos+ops@example-internal.test, landline (02) 8123-4567
Client: Bogdan, project "Project Narra"

The admin reset link https://portal.dogban.ai/admin/reset?token=abc123 returns 500.
Support ticket: https://support.bogdan.test/ticket/12345

Infra:
- API host juan-main.dogban.ai at 203.0.113.10 (fallback 198.51.100.24)
- IPv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334, MAC AA:BB:CC:DD:EE:FF / a1b2.c3d4.e5f6
- DB: postgres://admin:SuperSecret123@db.internal.local:5432/prod
- Config lives in C:\\Users\\juan\\Desktop\\secrets.txt and /home/juan/.ssh/id_rsa

Request that fails (request id 550e8400-e29b-41d4-a716-446655440000):
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def
  Cookie: session=ABCDEF1234567890

.env excerpt:
  AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
  STRIPE_SECRET=sk_test_51NabcXYZ1234567890
  GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrst
  SLACK_BOT_TOKEN=xoxb-123456789012-123456789012-abcdefghijklmnop
  api_key = "q9X2mLr7Vt"

Billing test data: card 4242 4242 4242 4242, IBAN GB82WEST12345698765432
KYC fields: NRIC S1234567A, FIN F7654321N, UEN T12AB3456C

-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----

What in app.py or routes.js could cause the 500?`;

export const SAMPLE_TERMS = [
  { value: "Juan Dela Cruz", entity: "PERSON" },
  { value: "Dogban", entity: "ORG" },
  { value: "Bogdan", entity: "ORG" },
  { value: "Project Narra", entity: "PROJECT" }
];
