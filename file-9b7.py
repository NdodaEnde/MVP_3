
from __future__ import annotations

from typing import Any, Dict

from pydantic import BaseModel, Field
from agentic_doc.parse import parse


class MedicalDocumentExtractionSchema(BaseModel):
    document_type: str = Field(
        ...,
        description='The detected type of the medical document (e.g., Certificate of Fitness, Audiometric Test Results, Spirometry Report, Consent Form, Medical Questionnaire, Vision Test, Continuation Form, etc.).',
        title='Document Type',
    )
    extracted_data: Dict[str, Any] = Field(
        ...,
        description='Relevant extracted fields for the detected document type. extract all document types there with their own sections',
        title='Extracted Data',
    )

# Parse a file and extract the fields
results = parse("mydoc.pdf", extraction_model=MedicalDocumentExtractionSchema)
fields = results[0].extraction

# Return the value of the extracted fields
print(fields)    
