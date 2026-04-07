import subprocess
try:
    import fitz
    doc = fitz.open("cahier_des_charges_alumni-3.pdf")
    for page in doc:
        print(page.get_text())
except Exception as e:
    import pypdf
    from pypdf import PdfReader
    reader = PdfReader("cahier_des_charges_alumni-3.pdf")
    for page in reader.pages:
        print(page.extract_text())
