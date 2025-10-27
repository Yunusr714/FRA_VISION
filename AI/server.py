import os
import json
from flask import Flask, request, jsonify, render_template_string
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import fitz  # PyMuPDF
import io

# --- Initialization ---
load_dotenv()
app = Flask(__name__)

from flask_cors import CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure the Gemini API
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    # --- THIS IS THE ONLY LINE YOU NEED TO CHANGE ---
    model = genai.GenerativeModel('gemini-2.5-flash') # Changed from 'pro' to 'flash'
    print("Gemini API configured successfully. ⚡")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

# --- The Ultimate System Prompt ---
# This prompt instructs the model to behave as an expert, extract specific fields,
# generate a summary, and return everything in a clean JSON format.
SYSTEM_PROMPT = """
You are a highly intelligent document processing engine specializing in Forest Rights Act (FRA) documents.
Your task is to analyze the provided document image and extract all key information.

You MUST return your response as a single, valid JSON object and nothing else.
The JSON object must contain two top-level keys: "extraction_result" and "summary".

1.  The "extraction_result" key must match this exact structure:
    {
      "claimant_name": "...",
      "spouse_name": "...",
      "father_name": "...",
      "mother_name": "...",
      "address": "...",
      "village": "...",
      "gram_panchayat": "...",
      "tehsil_taluka": "...",
      "district": "...",
      "scheduled_tribe": boolean | null,
      "otfd": boolean | null,
      "other_members": ["..."] | [],
      "self_cultivation_area_ha": "...",
      "signature_present": boolean
    }
    - For boolean fields, use true or false. If the information is not present, use null.
    - For names, extract full names including titles like Sh. or Smt.
    - For 'other_members', list all dependent names as strings in an array.

2.  The "summary" key must contain a concise, human-readable paragraph summarizing the document. The summary should state who the claim is for, their location, the size of the land, and the key dependents mentioned.
"""

# --- Helper Function for PDF to Image Conversion ---
def pdf_to_image(pdf_bytes):
    """Converts the first page of a PDF file into a PIL Image."""
    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        # Process only the first page for speed, as FRA forms are often single-page
        page = pdf_document.load_page(0)
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return img
    except Exception as e:
        print(f"Error converting PDF to image: {e}")
        return None

# --- Main API Endpoint ---
@app.route('/process-document', methods=['POST'])
def process_document():
    if not model:
        return jsonify({"error": "Gemini model is not configured. Check API key."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        file_bytes = file.read()
        image = None

        if file.mimetype.startswith('image/'):
            image = Image.open(io.BytesIO(file_bytes))
        elif file.mimetype == 'application/pdf':
            image = pdf_to_image(file_bytes)
            if image is None:
                return jsonify({"error": "Failed to convert PDF to image."}), 500
        else:
            return jsonify({"error": "Unsupported file type. Please upload an image or PDF."}), 400
        
        # Call the Gemini API
        response = model.generate_content([SYSTEM_PROMPT, image])
        
        # Clean and parse the JSON response from the model
        response_text = response.text.strip().replace("```json", "").replace("```", "")
        result_json = json.loads(response_text)

        # Reconstruct the response to match the user's desired final format
        final_output = {
            "input": file.filename,
            "page_count": 1,
            "pages": [
                {
                    "page_number": 1,
                    "fields": result_json.get("extraction_result", {})
                }
            ],
            "extracted": result_json.get("extraction_result", {}),
            "summary": result_json.get("summary", "No summary generated.")
        }

        return jsonify(final_output)

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse JSON from AI model. Raw response: " + response.text}), 500
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

# --- Simple HTML Frontend Route ---
# This serves the uploader page from a string directly within the Python script
@app.route('/', methods=['GET'])
def index():
    return render_template_string(open('index.html').read())

# --- Run the App ---
if __name__ == '__main__':
    # Makes the server accessible on your local network
    app.run(host='0.0.0.0', port=5000, debug=True)