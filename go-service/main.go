package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/jung-kurt/gofpdf"
)

// Student represents the student data from the backend API
type Student struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	Roll               int    `json:"roll"`
	Phone              string `json:"phone"`
	Gender             string `json:"gender"`
	DOB                string `json:"dob"`
	Class              string `json:"class"`
	Section            string `json:"section"`
	FatherName         string `json:"fatherName"`
	FatherPhone        string `json:"fatherPhone"`
	MotherName         string `json:"motherName"`
	MotherPhone        string `json:"motherPhone"`
	GuardianName       string `json:"guardianName"`
	GuardianPhone      string `json:"guardianPhone"`
	RelationOfGuardian string `json:"relationOfGuardian"`
	CurrentAddress     string `json:"currentAddress"`
	PermanentAddress   string `json:"permanentAddress"`
	AdmissionDate      string `json:"admissionDate"`
	ReporterName       string `json:"reporterName"`
	SystemAccess       bool   `json:"systemAccess"`
}

var (
	backendURL = getEnv("BACKEND_URL", "http://localhost:5007")
	port       = getEnv("PORT", "8080")
)

func main() {
	router := mux.NewRouter()

	// Health check endpoint
	router.HandleFunc("/health", healthCheckHandler).Methods("POST", "GET")

	// PDF generation endpoint - receives student data from backend
	router.HandleFunc("/api/v1/generate-pdf", generatePDFFromDataHandler).Methods("POST")

	log.Printf("Go PDF Service starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "student-pdf-report",
	})
}

func generatePDFFromDataHandler(w http.ResponseWriter, r *http.Request) {
	// Decode student data from request body
	var student Student
	if err := json.NewDecoder(r.Body).Decode(&student); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	log.Printf("Generating PDF for student: %s (ID: %d)", student.Name, student.ID)

	// Generate PDF
	pdf, err := generatePDF(&student)
	if err != nil {
		log.Printf("Error generating PDF: %v", err)
		http.Error(w, fmt.Sprintf("Error generating PDF: %v", err), http.StatusInternalServerError)
		return
	}

	// Set headers for PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=student_%d_report.pdf", student.ID))

	// Write PDF to response
	if err := pdf.Output(w); err != nil {
		log.Printf("Error writing PDF to response: %v", err)
		http.Error(w, "Error writing PDF", http.StatusInternalServerError)
		return
	}

	log.Printf("PDF report generated successfully for student ID: %d", student.ID)
}

func generatePDF(student *Student) (*gofpdf.Fpdf, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 20)
	pdf.SetTextColor(0, 0, 128)
	pdf.CellFormat(0, 15, "STUDENT REPORT", "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Student Photo placeholder (if needed in future)
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(100, 100, 100)
	currentDate := time.Now().Format("January 2, 2006")
	pdf.CellFormat(0, 5, "Generated on: "+currentDate, "", 1, "R", false, 0, "")
	pdf.Ln(5)

	// Personal Information Section
	addSection(pdf, "Personal Information")

	addField(pdf, "Name:", student.Name)
	addField(pdf, "Roll No:", fmt.Sprintf("%d", student.Roll))
	addField(pdf, "Date of Birth:", formatDate(student.DOB))
	addField(pdf, "Gender:", student.Gender)
	addField(pdf, "Admission Date:", formatDate(student.AdmissionDate))

	pdf.Ln(5)

	// Contact Information Section
	addSection(pdf, "Contact Information")

	addField(pdf, "Email:", student.Email)
	addField(pdf, "Phone:", student.Phone)
	addField(pdf, "Current Address:", student.CurrentAddress)
	addField(pdf, "Permanent Address:", student.PermanentAddress)

	pdf.Ln(5)

	// Academic Information Section
	addSection(pdf, "Academic Information")

	addField(pdf, "Class:", student.Class)
	addField(pdf, "Section:", student.Section)
	addField(pdf, "Reporter/Teacher:", student.ReporterName)

	pdf.Ln(5)

	// Family Information Section
	addSection(pdf, "Family Information")

	addField(pdf, "Father Name:", student.FatherName)
	addField(pdf, "Father Phone:", student.FatherPhone)
	addField(pdf, "Mother Name:", student.MotherName)
	addField(pdf, "Mother Phone:", student.MotherPhone)
	addField(pdf, "Guardian Name:", student.GuardianName)
	addField(pdf, "Guardian Phone:", student.GuardianPhone)
	addField(pdf, "Guardian Relation:", student.RelationOfGuardian)

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(150, 150, 150)
	pdf.CellFormat(0, 5, "This is a computer-generated document. No signature required.", "", 1, "C", false, 0, "")

	return pdf, nil
}

func addSection(pdf *gofpdf.Fpdf, title string) {
	pdf.SetFont("Arial", "B", 14)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(240, 240, 240)
	pdf.CellFormat(0, 10, title, "", 1, "L", true, 0, "")
	pdf.Ln(2)
}

func addField(pdf *gofpdf.Fpdf, label, value string) {
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(50, 50, 50)
	pdf.Cell(50, 8, label)

	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(0, 0, 0)
	pdf.Cell(0, 8, value)
	pdf.Ln(8)
}

func formatDate(dateStr string) string {
	if dateStr == "" {
		return "N/A"
	}
	// Parse ISO date format and convert to readable format
	t, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		return dateStr // Return as-is if parsing fails
	}
	return t.Format("January 2, 2006")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
