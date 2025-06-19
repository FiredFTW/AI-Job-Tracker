// client/src/components/ApplicationModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, VStack, Select // <-- Import Select for the status
} from '@chakra-ui/react';
import api from '../utils/api';

// The modal now accepts an `existingApplication` prop
const ApplicationModal = ({ isOpen, onClose, onSave, existingApplication }) => {
  // Determine if we are in "Edit Mode"
  const isEditMode = Boolean(existingApplication);

  // Set up state for ALL the fields in our database model
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'ACTIVE', // Default status
    nextStep: '',
    appliedAt: '', // Add appliedAt
    lastContactedAt: '', // Add lastContactedAt
  });

  // This `useEffect` hook runs whenever the `existingApplication` prop changes.
  // If we are in Edit Mode, it populates the form with the application's data.
  useEffect(() => {
    if (isEditMode && existingApplication) {
      setFormData({
        company: existingApplication.company || '',
        role: existingApplication.role || '',
        status: existingApplication.status || 'ACTIVE',
        nextStep: existingApplication.nextStep || '',
        appliedAt: existingApplication.appliedAt
          ? new Date(existingApplication.appliedAt).toISOString().split('T')[0]
          : '',
        lastContactedAt: existingApplication.lastContactedAt
          ? new Date(existingApplication.lastContactedAt).toISOString().split('T')[0]
          : '',
      });
    } else {
      // If in Create Mode, reset the form to its default state
      setFormData({
        company: '', role: '', status: 'ACTIVE', nextStep: '', appliedAt: '', lastContactedAt: ''
      });
    }
  }, [existingApplication, isOpen, isEditMode]); // Rerun when the modal is opened or the app data changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prepare data for submission, ensuring empty date strings become null
    const dataToSubmit = {
      ...formData,
      appliedAt: formData.appliedAt || null,
      lastContactedAt: formData.lastContactedAt || null,
    };

    try {
      let res;
      if (isEditMode) {
        // If editing, send a PUT request to the update endpoint
        res = await api.put(`/applications/${existingApplication.id}`, dataToSubmit);
      } else {
        // If creating, send a POST request
        res = await api.post('/applications', dataToSubmit);
      }
      onSave(res.data); // Pass the new/updated application back to the parent
      onClose(); // Close the modal
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{isEditMode ? 'Edit Application' : 'Add New Application'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Company</FormLabel>
              <Input name="company" value={formData.company} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Input name="role" value={formData.role} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Next Step</FormLabel>
              <Input name="nextStep" value={formData.nextStep} onChange={handleChange} placeholder="e.g., Online Assessment" />
            </FormControl>
            <FormControl>
              <FormLabel>Last Contacted</FormLabel>
              <Input type="date" name="lastContactedAt" value={formData.lastContactedAt} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Date Applied</FormLabel>
              <Input type="date" name="appliedAt" value={formData.appliedAt} onChange={handleChange} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button type="submit" colorScheme="blue">Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ApplicationModal;