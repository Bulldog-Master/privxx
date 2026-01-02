/**
 * Contact Picker Component
 * 
 * Dropdown to select from saved contacts or add new ones
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts } from "../hooks/useContacts";
import { isValidCmixxId } from "../types";
import type { Contact } from "../types";

interface ContactPickerProps {
  currentRecipient: string;
  onSelect: (recipientId: string) => void;
}

export function ContactPicker({ currentRecipient, onSelect }: ContactPickerProps) {
  const { t } = useTranslation();
  const { contacts, addContact, removeContact } = useContacts();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSelect = (contact: Contact) => {
    onSelect(contact.recipientId);
    setIsOpen(false);
  };

  const handleSaveCurrent = () => {
    if (!newName.trim()) return;
    if (!currentRecipient.trim() || currentRecipient === "self") return;
    
    addContact(newName, currentRecipient);
    setNewName("");
    setIsAdding(false);
  };

  const handleDelete = (contactId: string) => {
    if (deleteConfirm === contactId) {
      removeContact(contactId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(contactId);
    }
  };

  const canSaveCurrent = 
    newName.trim().length > 0 && 
    currentRecipient.trim().length > 0 && 
    currentRecipient !== "self" &&
    isValidCmixxId(currentRecipient) &&
    !contacts.some((c) => c.recipientId === currentRecipient);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary/60 hover:text-primary"
          title={t("selectContact", "Select contact")}
        >
          <Users className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-medium text-sm">{t("contacts", "Contacts")}</h4>
        </div>

        {contacts.length === 0 && !isAdding ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("noContacts", "No saved contacts")}
          </div>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="p-2 space-y-1">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => handleSelect(contact)}
                  >
                    <div className="text-sm font-medium truncate">{contact.name}</div>
                    <div className="text-xs text-muted-foreground truncate font-mono">
                      {contact.recipientId.slice(0, 12)}...
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 shrink-0 ${
                      deleteConfirm === contact.id
                        ? "text-destructive"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                    onClick={() => handleDelete(contact.id)}
                  >
                    {deleteConfirm === contact.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Add current recipient */}
        <div className="p-3 border-t border-border">
          {isAdding ? (
            <div className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("contactName", "Contact name")}
                className="h-8 text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={handleSaveCurrent}
                  disabled={!canSaveCurrent}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {t("save", "Save")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setIsAdding(false);
                    setNewName("");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={() => setIsAdding(true)}
              disabled={!currentRecipient.trim() || currentRecipient === "self"}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("saveCurrentRecipient", "Save current recipient")}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
