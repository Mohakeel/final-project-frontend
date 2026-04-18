"""
Quick script to display test credentials
"""

print("\n" + "="*70)
print("🔑 CERTIVERSIFY TEST CREDENTIALS")
print("="*70)
print("\n📌 Password for ALL accounts: password123\n")

print("👤 APPLICANTS (Job Seekers)")
print("-" * 70)
applicants = [
    "john.doe@email.com",
    "sarah.wilson@email.com",
    "michael.chen@email.com",
    "emily.brown@email.com",
    "david.martinez@email.com",
    "lisa.anderson@email.com",
    "james.taylor@email.com",
    "sophia.garcia@email.com"
]
for email in applicants:
    print(f"  • {email}")

print("\n🏢 EMPLOYERS (Companies)")
print("-" * 70)
employers = [
    ("hr@techcorp.com", "TechCorp Inc"),
    ("jobs@innovatesoft.com", "InnovateSoft"),
    ("careers@datastream.com", "DataStream Analytics"),
    ("hiring@cloudnine.com", "CloudNine Solutions"),
    ("recruit@fintech.com", "FinTech Global"),
    ("talent@greentech.com", "GreenTech Industries")
]
for email, company in employers:
    print(f"  • {email:30} ({company})")

print("\n🎓 UNIVERSITIES (Educational Institutions)")
print("-" * 70)
universities = [
    ("admin@stanford.edu", "Stanford University"),
    ("registrar@mit.edu", "MIT"),
    ("admin@berkeley.edu", "UC Berkeley"),
    ("records@harvard.edu", "Harvard University"),
    ("admin@caltech.edu", "Caltech")
]
for email, uni in universities:
    print(f"  • {email:30} ({uni})")

print("\n" + "="*70)
print("💡 Quick Start:")
print("   1. Run: python seed_database.py")
print("   2. Start backend: python app.py")
print("   3. Login with any account above")
print("="*70 + "\n")
