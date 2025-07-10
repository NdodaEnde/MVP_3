
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field
from agentic_doc.parse import parse


class MedicalExaminationTest(BaseModel):
    test_name: str = Field(
        ..., description='The name of the medical test.', title='Test Name'
    )
    done: bool = Field(
        ...,
        description='Indicates if the test was performed (true if checked/✓, false if X).',
        title='Test Done',
    )
    result: str = Field(
        ..., description='The result or outcome of the test.', title='Test Result'
    )


class OccupationalHealthCertificateFieldExtractionSchema(BaseModel):
    initials_and_surname: str = Field(
        ...,
        description='The initials and surname of the employee being certified.',
        title='Initials and Surname',
    )
    id_no: str = Field(
        ..., description='The identification number of the employee.', title='ID Number'
    )
    company_name: str = Field(
        ...,
        description='The name of the company employing the individual.',
        title='Company Name',
    )
    date_of_examination: str = Field(
        ...,
        description='The date on which the medical examination was conducted.',
        title='Date of Examination',
    )
    expiry_date: str = Field(
        ...,
        description='The date on which the certificate of fitness expires.',
        title='Expiry Date',
    )
    job_title: str = Field(
        ..., description='The job title of the employee.', title='Job Title'
    )
    pre_employment: bool = Field(
        ...,
        description='Indicates if the examination is for pre-employment (true if checked, false otherwise).',
        title='Pre-Employment',
    )
    periodical: bool = Field(
        ...,
        description='Indicates if the examination is a periodical check (true if checked, false otherwise).',
        title='Periodical',
    )
    exit: bool = Field(
        ...,
        description='Indicates if the examination is for exit (true if checked, false otherwise).',
        title='Exit',
    )
    medical_examination_tests: List[MedicalExaminationTest] = Field(
        ...,
        description='A list of tests conducted during the medical examination, including their status and results.',
        title='Medical Examination Conducted Tests',
    )
    referred_or_follow_up_actions: List[str] = Field(
        ...,
        description='A list of actions or recommendations for follow-up or referral.',
        title='Referred or Follow Up Actions',
    )
    review_date: str = Field(
        ...,
        description='The date scheduled for review, if specified.',
        title='Review Date',
    )
    restrictions: List[str] = Field(
        ...,
        description='A list of restrictions or special conditions applicable to the employee.',
        title='Restrictions',
    )
    medical_fitness_declaration: str = Field(
        ...,
        description='The outcome of the medical fitness assessment.',
        title='Medical Fitness Declaration',
    )
    comments: str = Field(
        ...,
        description='Additional comments or notes provided by the practitioner.',
        title='Comments',
    )
    signature: str = Field(
        ...,
        description="A description or representation of the practitioner's signature.",
        title='Signature',
    )
    stamp: str = Field(
        ...,
        description='A description or representation of the official stamp on the certificate.',
        title='Stamp',
    )

# Parse a file and extract the fields
results = parse("mydoc.pdf", extraction_model=OccupationalHealthCertificateFieldExtractionSchema)
fields = results[0].extraction

# Return the value of the extracted fields
print(fields)    
