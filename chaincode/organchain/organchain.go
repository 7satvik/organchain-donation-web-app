package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// BloodCompatibilityMap defines who can receive from whom
var BloodCompatibilityMap = map[string][]string{
	"O-":  {"O-"},
	"O+":  {"O+", "O-"},
	"A-":  {"A-", "O-"},
	"A+":  {"A+", "A-", "O+", "O-"},
	"B-":  {"B-", "O-"},
	"B+":  {"B+", "B-", "O+", "O-"},
	"AB-": {"AB-", "A-", "B-", "O-"},
	"AB+": {"AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"},
}

// SmartContract provides functions for managing patients and donors
type SmartContract struct {
	contractapi.Contract
}

// --- MODELS ---

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
	VerificationStatus string   `json:"verificationStatus"`
	VerifiedBy         string   `json:"verifiedBy"`
	DocType            string   `json:"docType"`
	CreatedAt          string   `json:"createdAt"`
}

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

type Hospital struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	PasswordHash string `json:"passwordHash"`
	Location     string `json:"location"`
	DocType      string `json:"docType"`
	CreatedAt    string `json:"createdAt"`
	IsActive     bool   `json:"isActive"`
}

// --- INTERNAL HELPERS (GENERICS) ---

func (s *SmartContract) getTimestamp(ctx contractapi.TransactionContextInterface) (string, error) {
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", err
	}
	return time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).Format(time.RFC3339), nil
}

func putState[T any](ctx contractapi.TransactionContextInterface, id string, data T) error {
	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, bytes)
}

func getState[T any](ctx contractapi.TransactionContextInterface, id string) (*T, error) {
	bytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if bytes == nil {
		return nil, fmt.Errorf("resource %s does not exist", id)
	}
	var val T
	if err := json.Unmarshal(bytes, &val); err != nil {
		return nil, err
	}
	return &val, nil
}

func queryPopulate[T any](ctx contractapi.TransactionContextInterface, startKey, endKey string) ([]*T, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var items []*T
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var item T
		if err := json.Unmarshal(queryResponse.Value, &item); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, nil
}

// --- SMART CONTRACT FUNCTIONS ---

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	ts, _ := s.getTimestamp(ctx)

	// Seed 4 Patients
	patients := []Patient{
		{ID: "PAT-001", NameHash: "hashed_name_1", BloodType: "A+", HLA: "A2, B35, DR1", OrganNeeded: "Kidney", IPFSHash: "ipfs_p_1", Status: "WAITING", HospitalID: "HOS1", DocType: "patient", CreatedAt: ts},
		{ID: "PAT-002", NameHash: "hashed_name_2", BloodType: "O-", HLA: "A1, B8, DR15", OrganNeeded: "Liver", IPFSHash: "ipfs_p_2", Status: "WAITING", HospitalID: "HOS1", DocType: "patient", CreatedAt: ts},
		{ID: "PAT-003", NameHash: "hashed_name_3", BloodType: "B+", HLA: "A3, B7, DR4", OrganNeeded: "Heart", IPFSHash: "ipfs_p_3", Status: "WAITING", HospitalID: "ADMIN-HOSP", DocType: "patient", CreatedAt: ts},
		{ID: "PAT-004", NameHash: "hashed_name_4", BloodType: "AB-", HLA: "A24, B44, DR17", OrganNeeded: "Kidney", IPFSHash: "ipfs_p_4", Status: "WAITING", HospitalID: "ADMIN-HOSP", DocType: "patient", CreatedAt: ts},
	}
	for _, p := range patients {
		if err := putState(ctx, p.ID, p); err != nil {
			return err
		}
	}

	// Seed 4 Donors
	donors := []Donor{
		{ID: "DON-101", Name: "Donor One", BloodType: "O-", HLA: "A1, B8, DR15", OrgansAvailable: []string{"Kidney", "Liver"}, IPFSHash: "ipfs_d_1", ConsentHash: "consent_1", DocType: "donor", CreatedAt: ts, VerificationStatus: "VERIFIED"},
		{ID: "DON-102", Name: "Donor Two", BloodType: "AB+", HLA: "A2, B35, DR1", OrgansAvailable: []string{"Heart"}, IPFSHash: "ipfs_d_2", ConsentHash: "consent_2", DocType: "donor", CreatedAt: ts, VerificationStatus: "VERIFIED"},
		{ID: "DON-103", Name: "Donor Three", BloodType: "A+", HLA: "A3, B7, DR4", OrgansAvailable: []string{"Kidney"}, IPFSHash: "ipfs_d_3", ConsentHash: "consent_3", DocType: "donor", CreatedAt: ts, VerificationStatus: "VERIFIED"},
		{ID: "DON-104", Name: "Donor Four", BloodType: "B-", HLA: "A24, B44, DR17", OrgansAvailable: []string{"Liver"}, IPFSHash: "ipfs_d_4", ConsentHash: "consent_4", DocType: "donor", CreatedAt: ts, VerificationStatus: "VERIFIED"},
	}
	for _, d := range donors {
		if err := putState(ctx, d.ID, d); err != nil {
			return err
		}
	}

	return s.InitHospitals(ctx)
}

func (s *SmartContract) InitHospitals(ctx contractapi.TransactionContextInterface) error {
	ts, _ := s.getTimestamp(ctx)
	hospitals := []Hospital{
		{ID: "ADMIN-HOSP", Name: "Admin Medical Center", PasswordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", Location: "Central", DocType: "hospital", CreatedAt: ts, IsActive: true},
		{ID: "HOS1", Name: "Hospital One", PasswordHash: "2c05de51fe8b3b2d9796704c85b4b215f7c600c10100bbb89f4792e210a8dcc3", Location: "North", DocType: "hospital", CreatedAt: ts, IsActive: true},
	}
	for _, h := range hospitals {
		if err := putState(ctx, h.ID, h); err != nil {
			return err
		}
	}
	return nil
}

func (s *SmartContract) RegisterHospital(ctx contractapi.TransactionContextInterface, id, name, passwordHash, location string) error {
	if exists, _ := s.RecordExists(ctx, id); exists {
		return fmt.Errorf("hospital %s already exists", id)
	}
	ts, _ := s.getTimestamp(ctx)
	return putState(ctx, id, Hospital{
		ID: id, Name: name, PasswordHash: passwordHash, Location: location,
		DocType: "hospital", CreatedAt: ts, IsActive: true,
	})
}

func (s *SmartContract) AuthenticateHospital(ctx contractapi.TransactionContextInterface, id, passwordHash string) (string, error) {
	h, err := getState[Hospital](ctx, id)
	if err != nil {
		return "", fmt.Errorf("authentication failed: hospital not found")
	}
	if !h.IsActive || h.PasswordHash != passwordHash {
		return "", fmt.Errorf("authentication failed: invalid credentials or inactive")
	}
	res, _ := json.Marshal(map[string]string{"id": h.ID, "name": h.Name, "location": h.Location})
	return string(res), nil
}

func (s *SmartContract) ClearLedger(ctx contractapi.TransactionContextInterface) error {
	prefixes := []string{"PAT-", "DON-", "MATCH-"}
	for _, p := range prefixes {
		it, _ := ctx.GetStub().GetStateByRange(p, p+"~")
		for it.HasNext() {
			res, _ := it.Next()
			_ = ctx.GetStub().DelState(res.Key)
		}
		it.Close()
	}
	return nil
}

func (s *SmartContract) CreatePatient(ctx contractapi.TransactionContextInterface, id, nameHash, bloodType, hla, organNeeded, ipfsHash, hospitalId string) error {
	if exists, _ := s.RecordExists(ctx, id); exists {
		return fmt.Errorf("patient %s already exists", id)
	}
	ts, _ := s.getTimestamp(ctx)
	return putState(ctx, id, Patient{
		ID: id, NameHash: nameHash, BloodType: bloodType, HLA: hla,
		OrganNeeded: organNeeded, IPFSHash: ipfsHash, Status: "WAITING",
		HospitalID: hospitalId, DocType: "patient", CreatedAt: ts,
	})
}

func (s *SmartContract) CreateDonor(ctx contractapi.TransactionContextInterface, id, name, email, phone, bloodType, hla, organsAvailableJSON, ipfsHash, consentHash string) error {
	if exists, _ := s.RecordExists(ctx, id); exists {
		return fmt.Errorf("donor %s already exists", id)
	}
	var organs []string
	_ = json.Unmarshal([]byte(organsAvailableJSON), &organs)
	ts, _ := s.getTimestamp(ctx)
	return putState(ctx, id, Donor{
		ID: id, Name: name, Email: email, Phone: phone, BloodType: bloodType, HLA: hla,
		OrgansAvailable: organs, IPFSHash: ipfsHash, ConsentHash: consentHash,
		VerificationStatus: "PENDING_VERIFICATION", DocType: "donor", CreatedAt: ts,
	})
}

func (s *SmartContract) VerifyDonor(ctx contractapi.TransactionContextInterface, donorId, hospitalId, status string) error {
	d, err := getState[Donor](ctx, donorId)
	if err != nil {
		return err
	}
	if status != "VERIFIED" && status != "REJECTED" {
		return fmt.Errorf("invalid status: must be VERIFIED or REJECTED")
	}
	d.VerificationStatus = status
	d.VerifiedBy = hospitalId
	return putState(ctx, donorId, d)
}

func (s *SmartContract) GetPatient(ctx contractapi.TransactionContextInterface, id string) (*Patient, error) {
	return getState[Patient](ctx, id)
}

func (s *SmartContract) GetDonor(ctx contractapi.TransactionContextInterface, id string) (*Donor, error) {
	d, err := getState[Donor](ctx, id)
	if err == nil && d.OrgansAvailable == nil {
		d.OrgansAvailable = []string{}
	}
	return d, err
}

func (s *SmartContract) GetHospital(ctx contractapi.TransactionContextInterface, id string) (*Hospital, error) {
	return getState[Hospital](ctx, id)
}

func (s *SmartContract) UpdateDonorStatus(ctx contractapi.TransactionContextInterface, id, organToRemove string) error {
	d, err := s.GetDonor(ctx, id)
	if err != nil {
		return err
	}
	var updated []string
	for _, o := range d.OrgansAvailable {
		if o != organToRemove {
			updated = append(updated, o)
		}
	}
	d.OrgansAvailable = updated
	return putState(ctx, id, d)
}

func (s *SmartContract) CreateMatch(ctx contractapi.TransactionContextInterface, id, patientId, donorId, organType, hlaScore, approvedBy string) error {
	p, errP := s.GetPatient(ctx, patientId)
	d, errD := s.GetDonor(ctx, donorId)
	if errP != nil || errD != nil {
		return fmt.Errorf("patient or donor not found")
	}

	if d.VerificationStatus != "VERIFIED" {
		return fmt.Errorf("donor not verified")
	}

	if !s.IsBloodCompatible(p.BloodType, d.BloodType) {
		return fmt.Errorf("blood type mismatch")
	}

	organFound := false
	for _, o := range d.OrgansAvailable {
		if o == organType {
			organFound = true
			break
		}
	}
	if !organFound {
		return fmt.Errorf("organ not available")
	}

	ts, _ := s.getTimestamp(ctx)
	p.Status = "MATCHED"
	_ = putState(ctx, p.ID, p)

	return putState(ctx, id, Match{
		ID: id, PatientID: patientId, DonorID: donorId, OrganType: organType,
		HLAScore: hlaScore, Status: "PENDING", DocType: "match", CreatedAt: ts, ApprovedBy: approvedBy,
	})
}

func (s *SmartContract) GetAllPatients(ctx contractapi.TransactionContextInterface) ([]*Patient, error) {
	return queryPopulate[Patient](ctx, "PAT-", "PAT-~")
}

func (s *SmartContract) GetAllDonors(ctx contractapi.TransactionContextInterface) ([]*Donor, error) {
	donors, err := queryPopulate[Donor](ctx, "DON-", "DON-~")
	for _, d := range donors {
		if d.OrgansAvailable == nil {
			d.OrgansAvailable = []string{}
		}
	}
	return donors, err
}

func (s *SmartContract) GetAllMatches(ctx contractapi.TransactionContextInterface) ([]*Match, error) {
	return queryPopulate[Match](ctx, "MATCH-", "MATCH-~")
}

func (s *SmartContract) GetAllHospitals(ctx contractapi.TransactionContextInterface) ([]*Hospital, error) {
	return queryPopulate[Hospital](ctx, "HOS", "HOS~") // Matches HOS1 and ADMIN-HOSP (both start with HOS/ADM, queryRange might need care)
}

func (s *SmartContract) RecordExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	res, err := ctx.GetStub().GetState(id)
	return res != nil, err
}

func (s *SmartContract) IsBloodCompatible(recipient, donor string) bool {
	compatible, exists := BloodCompatibilityMap[recipient]
	if !exists {
		return false
	}
	for _, t := range compatible {
		if t == donor {
			return true
		}
	}
	return false
}

func main() {
	cc, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating chaincode: %v", err)
	}
	if err := cc.Start(); err != nil {
		log.Panicf("Error starting chaincode: %v", err)
	}
}
