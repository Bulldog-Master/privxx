/**
 * Contacts Hook
 * 
 * Manages saved contacts in localStorage (privacy-first: no server storage)
 */

import { useState, useEffect, useCallback } from "react";
import type { Contact } from "../types";

const CONTACTS_STORAGE_KEY = "privxx_contacts";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Load contacts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Contact[];
        setContacts(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save contacts to localStorage
  const saveContacts = useCallback((newContacts: Contact[]) => {
    setContacts(newContacts);
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
    } catch {
      // Storage full or unavailable
    }
  }, []);

  const addContact = useCallback((name: string, recipientId: string) => {
    const newContact: Contact = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      name: name.trim(),
      recipientId: recipientId.trim(),
      createdAt: Date.now(),
    };
    const updated = [...contacts, newContact];
    saveContacts(updated);
    return newContact;
  }, [contacts, saveContacts]);

  const removeContact = useCallback((contactId: string) => {
    const updated = contacts.filter((c) => c.id !== contactId);
    saveContacts(updated);
  }, [contacts, saveContacts]);

  const updateContact = useCallback((contactId: string, name: string, recipientId: string) => {
    const updated = contacts.map((c) =>
      c.id === contactId
        ? { ...c, name: name.trim(), recipientId: recipientId.trim() }
        : c
    );
    saveContacts(updated);
  }, [contacts, saveContacts]);

  return {
    contacts,
    addContact,
    removeContact,
    updateContact,
  };
}
