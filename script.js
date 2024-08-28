

// new line

document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

let fileContent = '';
let studentName = '';
let analysisResult = {};

function handleFileSelect(event) {
    const file = event.target.files[0];
    readFile(file, (content) => {
        fileContent = content;
        studentName = extractStudentName(content);
        analysisResult = performAnalysis(fileContent);
        displayResults(analysisResult, studentName);
    });
}

function readFile(file, callback) {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        readPDF(file, callback);
    } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        readWordDoc(file, callback);
    } else {
        alert('Unsupported file type! Please upload a PDF or Word document.');
    }
}

function readPDF(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const loadingTask = pdfjsLib.getDocument({data: new Uint8Array(e.target.result)});
        loadingTask.promise.then(function(pdf) {
            let content = '';
            const promises = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                promises.push(pdf.getPage(i).then(function(page) {
                    return page.getTextContent().then(function(textContent) {
                        content += textContent.items.map(item => item.str).join(' ') + ' ';
                        console.log(`Extracted content from page ${i}`);
                    }).catch(function(error) {
                        console.error(`Error extracting content from page ${i}: ${error}`);
                    });
                }));
            }

            Promise.all(promises).then(function() {
                console.log(`Total pages extracted: ${pdf.numPages}`);
                callback(content);
            }).catch(function(error) {
                console.error(`Error extracting content from PDF: ${error}`);
            });
        }).catch(function(error) {
            console.error(`Error loading PDF: ${error}`);
        });
    };
    reader.readAsArrayBuffer(file);
}


function readWordDoc(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        const doc = new Docxtemplater().loadZip(new PizZip(arrayBuffer));
        const content = doc.getFullText();
        callback(content);
    };
    reader.readAsArrayBuffer(file);
}

function extractStudentName(content) {
    const namePattern = /Student Name:\s*([A-Za-z\s]+)/i;
    const match = content.match(namePattern);
    return match ? match[1].trim() : 'Name not found';
}

function checkCompliance(content, complianceKeywords, nonComplianceKeywords) {
    let logDetails = [];

    // Handling split text (e.g., words split across lines/pages)
    content = content.replace(/\s+/g, ' ').trim(); // Replace multiple spaces/newlines with a single space

    // Check for non-compliance indicators
    for (let i = 0; i < nonComplianceKeywords.length; i++) {
        const regex = new RegExp(nonComplianceKeywords[i], 'i');
        if (regex.test(content)) {
            logDetails.push(`Non-compliance keyword found: "${nonComplianceKeywords[i]}"`);
            return { status: 'Non-compliant', details: logDetails };
        }
    }

    // Check for compliance indicators
    for (let i = 0; i < complianceKeywords.length; i++) {
        const regex = new RegExp(complianceKeywords[i], 'i');
        if (regex.test(content)) {
            logDetails.push(`Compliance keyword found: "${complianceKeywords[i]}"`);
            return { status: 'Compliant', details: logDetails };
        }
    }

    // Default to "Non-compliant"
    logDetails.push('No matching keywords found.');
    return { status: 'Non-compliant', details: logDetails };
}


function performAnalysis(content) {
    return {
        'Section II: Evaluation/Reevaluation': {
            'II.A.1 Completion of Evaluation/Reevaluation': checkCompliance(content, [
                'evaluation completed within 60 calendar days',
                'eligibility determination',
                'team participation'
            ], [
                'evaluation not completed within 60 days',
                'eligibility not determined',
                'no evidence of team participation'
            ]),
            'II.A.2 Review of Existing Data': checkCompliance(content, [
                'review of existing data within 15 school days',
                'parent request for review',
                'the timeline is met',
                'parent\'s written request',
                'PWN issued within 15 school days'
            ], [
                'no review of existing data',
                'parent request not fulfilled',
                'PWN not issued'
            ]),
            'II.A.3 Team Determination of Need for Additional Data': checkCompliance(content, [
                'team determined that additional data was needed',
                'team discussed and made a determination',
                'additional data required',
                'data reviewed and additional data determined necessary'
            ], [
                'no additional data determined',
                'no team determination'
            ]),
            'II.A.4 Eligibility Considerations': checkCompliance(content, [
                'eligibility considerations',
                'eligibility criteria met',
                'determination of eligibility based on data',
                'evidence of team decision on eligibility'
            ], [
                'eligibility not considered',
                'eligibility criteria not met',
                'no determination of eligibility'
            ]),
            'II.A.5 Initial Evaluations Completed within 60 Calendar Days of Receipt of Informed Written Consent of Parent': checkCompliance(content, [
                'initial evaluation completed within 60 calendar days',
                'informed written consent of parent received',
                'evaluation completed within 60 days after consent',
                'parental consent obtained and evaluation conducted'
            ], [
                'initial evaluation not completed within 60 days',
                'parental consent not obtained',
                'evaluation delayed beyond 60 days'
            ])
        },
        'Section III: Individualized Education Program': {
            'III.A.1 Current IEP': checkCompliance(content, [
                'current IEP within 365 days',
                'IEP in place within last year',
                'valid IEP on file',
                'current individualized education program'
            ], [
                'no current IEP within 365 days',
                'expired IEP',
                'IEP not valid'
            ]),
            'III.A.2 IEP Review/Revision and Participants': checkCompliance(content, [
                'IEP review conducted within 365 days',
                'IEP revision completed',
                'required participants present',
                'IEP review and revision documented'
            ], [
                'IEP review not conducted within 365 days',
                'required participants not present',
                'IEP not reviewed or revised'
            ]),
            'III.A.3 General Required Components of the IEP Are Included': checkCompliance(content, [
                'PLAAFP',
                'present level of academic achievement and functional performance',
                'measurable annual goals',
                'current assessment data',
                'general required components'
            ], [
                'missing PLAAFP',
                'no measurable annual goals',
                'current assessment data not included'
            ]),
            'III.A.4 Special Education and Related Services': checkCompliance(content, [
                'specially designed instruction',
                'related services',
                'program modifications',
                'special education services provided'
            ], [
                'missing specially designed instruction',
                'related services not provided',
                'program modifications not included'
            ]),
            'III.A.5 Other Considerations': checkCompliance(content, [
                'considerations',
                'behavioral intervention',
                'assistive technology',
                'cultural and linguistic factors'
            ], [
                'no considerations documented',
                'behavioral intervention not addressed',
                'assistive technology not considered'
            ]),
            'III.A.6 Postsecondary Transition Components': checkCompliance(content, [
                'postsecondary transition',
                'transition services',
                'planning for life after high school',
                'preparing for postsecondary education or employment'
            ], [
                'postsecondary transition components missing',
                'no transition services provided',
                'planning for life after high school not documented'
            ]),
            'III.A.7 Additional Postsecondary Transition Components': checkCompliance(content, [
                'additional postsecondary transition',
                'career exploration',
                'independent living skills',
                'additional planning for postsecondary transition'
            ], [
                'no additional postsecondary transition components',
                'career exploration not included',
                'independent living skills not addressed'
            ]),
            'III.A.8 Documentation That IEP Reflects Student Needs': checkCompliance(content, [
                'reflects student needs',
                'individualized education',
                'IEP tailored to student needs',
                'documentation supports student\'s educational needs'
            ], [
                'IEP does not reflect student needs',
                'individualized education not provided',
                'documentation does not support student needs'
            ])
        },
        'Section IV: Procedural Safeguards/Parental Participation': {
            'IV.A.1 Notices Sent at Required Times and in a Language and Form That Is Understandable to Parents': checkCompliance(content, [
                'notices provided at required times',
                'language and form understandable to parents',
                'communication with parents in understandable format',
                'notices in parent\'s native language'
            ], [
                'notices not provided at required times',
                'language and form not understandable to parents',
                'no communication with parents',
                'notices not in parent\'s native language'
            ]),
            'IV.A.2 PWN Sent at Required Times and Contains Required Components': checkCompliance(content, [
                'prior written notice',
                'PWN provided at required times',
                'PWN contains required components',
                'PWN issued and documented'
            ], [
                'PWN not provided at required times',
                'PWN missing required components',
                'PWN not issued'
            ]),
            'IV.A.3 Discipline Procedures and Requirements Followed': checkCompliance(content, [
                'discipline procedures followed',
                'IEP team meetings conducted for discipline',
                'functional behavioral assessments',
                'behavior intervention plans'
            ], [
                'discipline procedures not followed',
                'no IEP team meetings for discipline',
                'no functional behavioral assessments conducted',
                'behavior intervention plans not implemented'
            ])
        }
    };
}

function displayResults(analysisResult, studentName) {
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = `<h2>Analysis Results for ${studentName}</h2>`;

    for (let section in analysisResult) {
        resultDiv.innerHTML += `<div class="section"><h4>${section}</h4>`;
        for (let item in analysisResult[section]) {
            const analysis = analysisResult[section][item];
            const statusClass = analysis.status === 'Compliant' ? 'compliant' : 'non-compliant';

            resultDiv.innerHTML += `
                <div class="criteria ${statusClass}">
                    <strong>${item}:</strong> 
                    Status: ${analysis.status}
                    <br>
                    Details: <ul>${analysis.details.map(detail => `<li>${detail}</li>`).join('')}</ul>
                </div>`;
        }
        resultDiv.innerHTML += `</div>`;
    }

    if (document.getElementById('downloadBtn')) {
        document.getElementById('downloadBtn').style.display = 'block';
    }

    if (document.getElementById('downloadPDFBtn')) {
        document.getElementById('downloadPDFBtn').style.display = 'block';
    }
}

function downloadReport() {
    const resultDiv = document.getElementById('results');
    const resultContent = resultDiv.innerText || resultDiv.textContent;
    const blob = new Blob([resultContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'IEP_Analysis_Results.txt';
    link.click();
}

function downloadPDFReport(studentName, analysisResult) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("Arial", "normal");
    doc.setFontSize(16);
    doc.text(`Analysis Results for ${studentName}`, 10, 10);

    let yOffset = 20;

    for (let section in analysisResult) {
        doc.setFontSize(14);
        doc.setTextColor(0, 45, 114); // Navy Blue for section titles
        doc.text(section, 10, yOffset);
        yOffset += 10;

        for (let item in analysisResult[section]) {
            const analysis = analysisResult[section][item];
            const color = analysis.status === 'Compliant' ? [0, 128, 0] : [255, 0, 0]; // Green for compliant, Red for non-compliant

            doc.setFontSize(12);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(`${item}: ${analysis.status}`, 20, yOffset);
            yOffset += 10;

            // Add details to the PDF
            analysis.details.forEach(detail => {
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0); // Black for details
                doc.text(`- ${detail}`, 25, yOffset);
                yOffset += 7;
            });

            yOffset += 5; // Extra space between items
        }

        yOffset += 10; // Extra space between sections
    }

    doc.save('IEP_Analysis_Results.pdf');
}

function setupUI() {
    // Ensure that the PDF.js library is loaded and set up properly
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}
console.log("Extracted content for review:", fileContent);

window.onload = setupUI;

