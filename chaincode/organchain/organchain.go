package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing patients and donors
type SmartContract struct {
	contractapi.Contract
}

// Patient describes a patient waiting for organ transplant
type Patient struct {
	ID          string `json:"id"`
	NameHash    string `json:"nameHash"`
	BloodType   string `json:"bloodType"`
	HLA         string `json:"hla"`
	OrganNeeded string `json:"organNeeded"`
	IPFSHash    string `json:"ipfsHash"`
	Status      string `json:"status"`
	HospitalID  string `json:"hospitalId"`
	DocType     string `json:"docType"`
	CreatedAt   string `json:"createdAt"`
}

// Donor describes an organ donor
type Donor struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Email              string   `json:"email"`
	Phone              string   `json:"phone"`
	BloodType          string   `json:"bloodType"`
	HLA                string   `json:"hla"`
	OrgansAvailable    []string `json:"organsAvailable"`
	IPFSHash           string   `json:"ipfsHash"`
	ConsentHash        string   `json:"consentHash"`
	VerificationStatus string   `json:"verificationStatus"` // PENDING_VERIFICATION, VERIFIED, REJECTED
	VerifiedBy         string   `json:"verifiedBy"`         // Hospital ID that verified
	DocType            string   `json:"docType"`
	CreatedAt          string   `json:"createdAt"`
}

// Match describes a match between a patient and donor
type Match struct {
	ID         string `json:"id"`
	PatientID  string `json:"patientId"`
	DonorID    string `json:"donorId"`
	OrganType  string `json:"organType"`
	HLAScore   string `json:"hlaScore"`
	Status     string `json:"status"`
	DocType    string `json:"docType"`
	CreatedAt  string `json:"createdAt"`
	ApprovedBy string `json:"approvedBy"`
}

// Hospital describes a registered hospital
type Hospital struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	PasswordHash string `json:"passwordHash"`
	Location     string `json:"location"`
	DocType      string `json:"docType"`
	CreatedAt    string `json:"createdAt"`
	IsActive     bool   `json:"isActive"`
}

// InitLedger adds initial data to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	patients := []Patient{
		{ID: "PAT-001", NameHash: "8f4343...", BloodType: "A+", HLA: "A2, A24, B35, B44, DR1, DR4", OrganNeeded: "Kidney", IPFSHash: "QmXyZ...123", Status: "WAITING", HospitalID: "HOSP-NY", DocType: "patient", CreatedAt: time.Now().Format(time.RFC3339)},
		{ID: "PAT-002", NameHash: "9a7121...", BloodType: "O-", HLA: "A1, A3, B7, B8, DR15, DR17", OrganNeeded: "Liver", IPFSHash: "QmAbC...456", Status: "WAITING", HospitalID: "HOSP-CA", DocType: "patient", CreatedAt: time.Now().Format(time.RFC3339)},
	}

	for _, patient := range patients {
		patientJSON, err := json.Marshal(patient)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(patient.ID, patientJSON)
		if err != nil {
			return fmt.Errorf("failed to put patient to world state: %v", err)
		}
	}

	donors := []Donor{
		{ID: "DON-101", BloodType: "O-", HLA: "A2, A24, B35, B44, DR1, DR4", OrgansAvailable: []string{"Kidney", "Liver"}, IPFSHash: "QmDon...999", ConsentHash: "0x123...signed", DocType: "donor", CreatedAt: time.Now().Format(time.RFC3339)},
		{ID: "DON-102", BloodType: "AB+", HLA: "A1, A2, B8, B44, DR3, DR4", OrgansAvailable: []string{"Heart"}, IPFSHash: "QmDon...888", ConsentHash: "0x456...signed", DocType: "donor", CreatedAt: time.Now().Format(time.RFC3339)},
	}

	for _, donor := range donors {
		donorJSON, err := json.Marshal(donor)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(donor.ID, donorJSON)
		if err != nil {
			return fmt.Errorf("failed to put donor to world state: %v", err)
		}
	}

	return nil
}

// InitHospitals seeds the ledger with pre-registered hospitals
func (s *SmartContract) InitHospitals(ctx contractapi.TransactionContextInterface) error {
	// Pre-registered hospitals with SHA-256 hashed passwords
	// Passwords: apollo123, aiims123, fortis123
	hospitals := []Hospital{
		{ID: "HOSP-APOLLO", Name: "Apollo Hospital", PasswordHash: "15da1cc6ebf7b7b13225c0d6d89e8cab4d40d4672c226618f1e74e5515685f2c", Location: "Mumbai", DocType: "hospital", CreatedAt: time.Now().Format(time.RFC3339), IsActive: true},
		{ID: "HOSP-AIIMS", Name: "AIIMS Delhi", PasswordHash: "7810c7831b4fcefb7fb887bde3ef976b9d442d39216b155c84f1f67b38f49229", Location: "New Delhi", DocType: "hospital", CreatedAt: time.Now().Format(time.RFC3339), IsActive: true},
		{ID: "HOSP-FORTIS", Name: "Fortis Hospital", PasswordHash: "72cceae42f682d82c0dc46bcd62c2cf85a95422b3d35eda8ef3e6c7d219e7af6", Location: "Bangalore", DocType: "hospital", CreatedAt: time.Now().Format(time.RFC3339), IsActive: true},
	}

	for _, hospital := range hospitals {
		hospitalJSON, err := json.Marshal(hospital)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(hospital.ID, hospitalJSON)
		if err != nil {
			return fmt.Errorf("failed to put hospital to world state: %v", err)
		}
	}

	return nil
}

// GetHospital returns a hospital by ID
func (s *SmartContract) GetHospital(ctx contractapi.TransactionContextInterface, id string) (*Hospital, error) {
	hospitalJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read hospital: %v", err)
	}
	if hospitalJSON == nil {
		return nil, fmt.Errorf("hospital %s does not exist", id)
	}

	var hospital Hospital
	err = json.Unmarshal(hospitalJSON, &hospital)
	if err != nil {
		return nil, err
	}

	return &hospital, nil
}

// AuthenticateHospital verifies hospital credentials
func (s *SmartContract) AuthenticateHospital(ctx contractapi.TransactionContextInterface, id string, passwordHash string) (string, error) {
	hospital, err := s.GetHospital(ctx, id)
	if err != nil {
		return "", fmt.Errorf("authentication failed: hospital not found")
	}

	if !hospital.IsActive {
		return "", fmt.Errorf("authentication failed: hospital is not active")
	}

	if hospital.PasswordHash != passwordHash {
		return "", fmt.Errorf("authentication failed: invalid credentials")
	}

	// Return hospital info as JSON on success
	result := map[string]string{
		"id":       hospital.ID,
		"name":     hospital.Name,
		"location": hospital.Location,
	}
	resultJSON, _ := json.Marshal(result)
	return string(resultJSON), nil
}

// GetAllHospitals returns all hospitals (for admin purposes)
func (s *SmartContract) GetAllHospitals(ctx contractapi.TransactionContextInterface) ([]*Hospital, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("HOSP-", "HOSP-~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var hospitals []*Hospital
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var hospital Hospital
		err = json.Unmarshal(queryResponse.Value, &hospital)
		if err != nil {
			return nil, err
		}
		hospitals = append(hospitals, &hospital)
	}

	return hospitals, nil
}

// ClearLedger removes all patients, donors, and matches from the ledger
func (s *SmartContract) ClearLedger(ctx contractapi.TransactionContextInterface) error {
	// Clear all patients
	patientsIterator, err := ctx.GetStub().GetStateByRange("PAT-", "PAT-~")
	if err != nil {
		return fmt.Errorf("failed to get patients iterator: %v", err)
	}
	defer patientsIterator.Close()

	for patientsIterator.HasNext() {
		result, err := patientsIterator.Next()
		if err != nil {
			return err
		}
		err = ctx.GetStub().DelState(result.Key)
		if err != nil {
			return fmt.Errorf("failed to delete patient %s: %v", result.Key, err)
		}
	}

	// Clear all donors
	donorsIterator, err := ctx.GetStub().GetStateByRange("DON-", "DON-~")
	if err != nil {
		return fmt.Errorf("failed to get donors iterator: %v", err)
	}
	defer donorsIterator.Close()

	for donorsIterator.HasNext() {
		result, err := donorsIterator.Next()
		if err != nil {
			return err
		}
		err = ctx.GetStub().DelState(result.Key)
		if err != nil {
			return fmt.Errorf("failed to delete donor %s: %v", result.Key, err)
		}
	}

	// Clear all matches
	matchesIterator, err := ctx.GetStub().GetStateByRange("MATCH-", "MATCH-~")
	if err != nil {
		return fmt.Errorf("failed to get matches iterator: %v", err)
	}
	defer matchesIterator.Close()

	for matchesIterator.HasNext() {
		result, err := matchesIterator.Next()
		if err != nil {
			return err
		}
		err = ctx.GetStub().DelState(result.Key)
		if err != nil {
			return fmt.Errorf("failed to delete match %s: %v", result.Key, err)
		}
	}

	return nil
}

// CreatePatient creates a new patient record on the ledger
func (s *SmartContract) CreatePatient(ctx contractapi.TransactionContextInterface, id string, nameHash string, bloodType string, hla string, organNeeded string, ipfsHash string, hospitalId string) error {
	exists, err := s.RecordExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("patient %s already exists", id)
	}

	patient := Patient{
		ID:          id,
		NameHash:    nameHash,
		BloodType:   bloodType,
		HLA:         hla,
		OrganNeeded: organNeeded,
		IPFSHash:    ipfsHash,
		Status:      "WAITING",
		HospitalID:  hospitalId,
		DocType:     "patient",
		CreatedAt:   time.Now().Format(time.RFC3339),
	}

	patientJSON, err := json.Marshal(patient)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, patientJSON)
}

// CreateDonor creates a new donor record on the ledger
func (s *SmartContract) CreateDonor(ctx contractapi.TransactionContextInterface, id string, name string, email string, phone string, bloodType string, hla string, organsAvailableJSON string, ipfsHash string, consentHash string) error {
	exists, err := s.RecordExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("donor %s already exists", id)
	}

	var organsAvailable []string
	err = json.Unmarshal([]byte(organsAvailableJSON), &organsAvailable)
	if err != nil {
		return fmt.Errorf("failed to parse organs: %v", err)
	}

	donor := Donor{
		ID:                 id,
		Name:               name,
		Email:              email,
		Phone:              phone,
		BloodType:          bloodType,
		HLA:                hla,
		OrgansAvailable:    organsAvailable,
		IPFSHash:           ipfsHash,
		ConsentHash:        consentHash,
		VerificationStatus: "PENDING_VERIFICATION",
		VerifiedBy:         "",
		DocType:            "donor",
		CreatedAt:          time.Now().Format(time.RFC3339),
	}

	donorJSON, err := json.Marshal(donor)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, donorJSON)
}

// VerifyDonor allows a hospital to verify or reject a donor
func (s *SmartContract) VerifyDonor(ctx contractapi.TransactionContextInterface, donorId string, hospitalId string, status string) error {
	donor, err := s.GetDonor(ctx, donorId)
	if err != nil {
		return err
	}

	if status != "VERIFIED" && status != "REJECTED" {
		return fmt.Errorf("invalid status: must be VERIFIED or REJECTED")
	}

	donor.VerificationStatus = status
	donor.VerifiedBy = hospitalId

	donorJSON, err := json.Marshal(donor)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(donorId, donorJSON)
}

// GetPatient returns a patient by ID
func (s *SmartContract) GetPatient(ctx contractapi.TransactionContextInterface, id string) (*Patient, error) {
	patientJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read patient: %v", err)
	}
	if patientJSON == nil {
		return nil, fmt.Errorf("patient %s does not exist", id)
	}

	var patient Patient
	err = json.Unmarshal(patientJSON, &patient)
	if err != nil {
		return nil, err
	}

	return &patient, nil
}

// GetDonor returns a donor by ID
func (s *SmartContract) GetDonor(ctx contractapi.TransactionContextInterface, id string) (*Donor, error) {
	donorJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read donor: %v", err)
	}
	if donorJSON == nil {
		return nil, fmt.Errorf("donor %s does not exist", id)
	}

	var donor Donor
	err = json.Unmarshal(donorJSON, &donor)
	if err != nil {
		return nil, err
	}

	// Ensure organsAvailable is not nil
	if donor.OrgansAvailable == nil {
		donor.OrgansAvailable = []string{}
	}

	return &donor, nil
}

// UpdateDonorStatus updates the status of a donor (e.g., mark organ as used)
func (s *SmartContract) UpdateDonorStatus(ctx contractapi.TransactionContextInterface, id string, organToRemove string) error {
	donor, err := s.GetDonor(ctx, id)
	if err != nil {
		return err
	}

	// Remove the used organ from available organs
	updatedOrgans := []string{} // Initialize as empty slice, not nil
	for _, organ := range donor.OrgansAvailable {
		if organ != organToRemove {
			updatedOrgans = append(updatedOrgans, organ)
		}
	}
	donor.OrgansAvailable = updatedOrgans

	donorJSON, err := json.Marshal(donor)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, donorJSON)
}

// GetAllPatients returns all patients from the world state
func (s *SmartContract) GetAllPatients(ctx contractapi.TransactionContextInterface) ([]*Patient, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("PAT-", "PAT-~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var patients []*Patient
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var patient Patient
		err = json.Unmarshal(queryResponse.Value, &patient)
		if err != nil {
			return nil, err
		}
		patients = append(patients, &patient)
	}

	return patients, nil
}

// GetAllDonors returns all donors from the world state
func (s *SmartContract) GetAllDonors(ctx contractapi.TransactionContextInterface) ([]*Donor, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("DON-", "DON-~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var donors []*Donor
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var donor Donor
		err = json.Unmarshal(queryResponse.Value, &donor)
		if err != nil {
			return nil, err
		}
		// Ensure organsAvailable is not nil (required by schema)
		if donor.OrgansAvailable == nil {
			donor.OrgansAvailable = []string{}
		}
		donors = append(donors, &donor)
	}

	return donors, nil
}

// CreateMatch records a match between patient and donor
func (s *SmartContract) CreateMatch(ctx contractapi.TransactionContextInterface, id string, patientId string, donorId string, organType string, hlaScore string, approvedBy string) error {
	match := Match{
		ID:         id,
		PatientID:  patientId,
		DonorID:    donorId,
		OrganType:  organType,
		HLAScore:   hlaScore,
		Status:     "PENDING",
		DocType:    "match",
		CreatedAt:  time.Now().Format(time.RFC3339),
		ApprovedBy: approvedBy,
	}

	matchJSON, err := json.Marshal(match)
	if err != nil {
		return err
	}

	// Update patient status
	patientJSON, err := ctx.GetStub().GetState(patientId)
	if err == nil && patientJSON != nil {
		var patient Patient
		json.Unmarshal(patientJSON, &patient)
		patient.Status = "MATCHED"
		updatedPatientJSON, _ := json.Marshal(patient)
		ctx.GetStub().PutState(patientId, updatedPatientJSON)
	}

	return ctx.GetStub().PutState(id, matchJSON)
}

// UpdatePatientStatus updates the status of a patient
func (s *SmartContract) UpdatePatientStatus(ctx contractapi.TransactionContextInterface, id string, status string) error {
	patient, err := s.GetPatient(ctx, id)
	if err != nil {
		return err
	}

	patient.Status = status
	patientJSON, err := json.Marshal(patient)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, patientJSON)
}

// GetAllMatches returns all matches from the world state
func (s *SmartContract) GetAllMatches(ctx contractapi.TransactionContextInterface) ([]*Match, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("MATCH-", "MATCH-~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var matches []*Match
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var match Match
		err = json.Unmarshal(queryResponse.Value, &match)
		if err != nil {
			return nil, err
		}
		matches = append(matches, &match)
	}

	return matches, nil
}

// RecordExists checks if a record exists in the world state
func (s *SmartContract) RecordExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	recordJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return recordJSON != nil, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating organchain chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting organchain chaincode: %v", err)
	}
}
