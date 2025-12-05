import { Business, Contact, Interaction } from '@/lib/types'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

// Dev mode local storage for testing without Supabase
// Data is stored in .dev-data/ directory

const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data')

function ensureDir() {
    if (!existsSync(DEV_DATA_DIR)) {
        mkdirSync(DEV_DATA_DIR, { recursive: true })
    }
}

function readStore<T>(name: string): T[] {
    ensureDir()
    const filePath = path.join(DEV_DATA_DIR, `${name}.json`)
    if (!existsSync(filePath)) {
        return []
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'))
}

function writeStore<T>(name: string, data: T[]) {
    ensureDir()
    const filePath = path.join(DEV_DATA_DIR, `${name}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Businesses
export function getBusinesses(): Business[] {
    return readStore<Business>('businesses').filter(b => !b.deleted_at)
}

export function getBusinessById(id: string): (Business & { contacts: Contact[], interactions: Interaction[] }) | null {
    const businesses = readStore<Business>('businesses')
    const business = businesses.find(b => b.id === id && !b.deleted_at)
    if (!business) return null

    const contacts = readStore<Contact>('contacts').filter(c => c.business_id === id)
    const interactions = readStore<Interaction>('interactions').filter(i => i.business_id === id)

    return { ...business, contacts, interactions }
}

export function createBusiness(data: Partial<Business>): Business {
    const businesses = readStore<Business>('businesses')
    const now = new Date().toISOString()

    const business: Business = {
        id: crypto.randomUUID(),
        name: data.name || '',
        category: data.category || null,
        description: data.description || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        province: data.province || 'NS',
        postal_code: data.postal_code || null,
        phone_raw: data.phone_raw || null,
        phone_e164: data.phone_e164 || null,
        email: data.email || null,
        website: data.website || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        naics_code: data.naics_code || null,
        size_band: data.size_band || null,
        status: data.status || 'active',
        source: data.source || 'manual',
        source_ref: data.source_ref || null,
        contact_count: 0,
        last_interaction_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by: 'dev-user',
        updated_by: 'dev-user',
    }

    businesses.push(business)
    writeStore('businesses', businesses)
    return business
}

export function updateBusiness(id: string, data: Partial<Business>): Business | null {
    const businesses = readStore<Business>('businesses')
    const index = businesses.findIndex(b => b.id === id)
    if (index === -1) return null

    businesses[index] = {
        ...businesses[index],
        ...data,
        updated_at: new Date().toISOString(),
    }
    writeStore('businesses', businesses)
    return businesses[index]
}

export function deleteBusiness(id: string): boolean {
    const businesses = readStore<Business>('businesses')
    const index = businesses.findIndex(b => b.id === id)
    if (index === -1) return false

    businesses[index].deleted_at = new Date().toISOString()
    writeStore('businesses', businesses)
    return true
}

// Contacts
export function getContacts(businessId?: string): Contact[] {
    const contacts = readStore<Contact>('contacts')
    if (businessId) {
        return contacts.filter(c => c.business_id === businessId)
    }
    return contacts
}

export function createContact(data: Partial<Contact>): Contact {
    const contacts = readStore<Contact>('contacts')
    const now = new Date().toISOString()

    // If marking as primary, unmark others
    if (data.is_primary && data.business_id) {
        contacts.forEach(c => {
            if (c.business_id === data.business_id) {
                c.is_primary = false
            }
        })
    }

    const contact: Contact = {
        id: crypto.randomUUID(),
        business_id: data.business_id || '',
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        position: data.position || null,
        email: data.email || null,
        phone_raw: data.phone_raw || null,
        phone_e164: data.phone_e164 || null,
        is_primary: data.is_primary || false,
        created_at: now,
        updated_at: now,
        created_by: 'dev-user',
    }

    contacts.push(contact)
    writeStore('contacts', contacts)

    // Update business contact count
    const businesses = readStore<Business>('businesses')
    const bizIndex = businesses.findIndex(b => b.id === data.business_id)
    if (bizIndex !== -1) {
        businesses[bizIndex].contact_count = (businesses[bizIndex].contact_count || 0) + 1
        writeStore('businesses', businesses)
    }

    return contact
}

export function updateContact(id: string, data: Partial<Contact>): Contact | null {
    const contacts = readStore<Contact>('contacts')
    const index = contacts.findIndex(c => c.id === id)
    if (index === -1) return null

    if (data.is_primary && data.business_id) {
        contacts.forEach(c => {
            if (c.business_id === data.business_id && c.id !== id) {
                c.is_primary = false
            }
        })
    }

    contacts[index] = {
        ...contacts[index],
        ...data,
        updated_at: new Date().toISOString(),
    }
    writeStore('contacts', contacts)
    return contacts[index]
}

export function deleteContact(id: string): boolean {
    const contacts = readStore<Contact>('contacts')
    const index = contacts.findIndex(c => c.id === id)
    if (index === -1) return false

    const businessId = contacts[index].business_id
    contacts.splice(index, 1)
    writeStore('contacts', contacts)

    // Update business contact count
    const businesses = readStore<Business>('businesses')
    const bizIndex = businesses.findIndex(b => b.id === businessId)
    if (bizIndex !== -1) {
        businesses[bizIndex].contact_count = Math.max(0, (businesses[bizIndex].contact_count || 1) - 1)
        writeStore('businesses', businesses)
    }

    return true
}

// Stats for dashboard
export function getStats() {
    const businesses = getBusinesses()
    const contacts = readStore<Contact>('contacts')
    const interactions = readStore<Interaction>('interactions')

    const byProvince = businesses.reduce((acc, b) => {
        acc[b.province] = (acc[b.province] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return {
        totalBusinesses: businesses.length,
        totalContacts: contacts.length,
        totalInteractions: interactions.length,
        byProvince,
        recentBusinesses: businesses.slice(-5).reverse(),
    }
}

// Interactions
export function getInteractions(businessId?: string): Interaction[] {
    const interactions = readStore<Interaction>('interactions')
    if (businessId) {
        return interactions.filter(i => i.business_id === businessId).sort((a, b) =>
            new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
        )
    }
    return interactions.sort((a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )
}

export function createInteraction(data: Partial<Interaction>): Interaction {
    const interactions = readStore<Interaction>('interactions')
    const now = new Date().toISOString()

    const interaction: Interaction = {
        id: crypto.randomUUID(),
        business_id: data.business_id || '',
        contact_id: data.contact_id || null,
        type: data.type || 'note',
        direction: data.direction || 'internal',
        subject: data.subject || null,
        notes: data.notes || null,
        external_ref: data.external_ref || null,
        occurred_at: data.occurred_at || now,
        user_id: 'dev-user',
        created_at: now,
    }

    interactions.push(interaction)
    writeStore('interactions', interactions)

    // Update business last_interaction_at
    const businesses = readStore<Business>('businesses')
    const bizIndex = businesses.findIndex(b => b.id === data.business_id)
    if (bizIndex !== -1) {
        businesses[bizIndex].last_interaction_at = interaction.occurred_at
        writeStore('businesses', businesses)
    }

    return interaction
}

export function deleteInteraction(id: string): boolean {
    const interactions = readStore<Interaction>('interactions')
    const index = interactions.findIndex(i => i.id === id)
    if (index === -1) return false

    interactions.splice(index, 1)
    writeStore('interactions', interactions)
    return true
}

// Tags
interface BusinessTag {
    id: string
    business_id: string
    tag_id: string
    created_at: string
}

export function getTags(): { id: string; name: string; color: string; created_at: string }[] {
    return readStore<{ id: string; name: string; color: string; created_at: string }>('tags')
}

export function createTag(data: { name: string; color?: string }): { id: string; name: string; color: string; created_at: string } {
    const tags = readStore<{ id: string; name: string; color: string; created_at: string }>('tags')
    const now = new Date().toISOString()

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
    const tag = {
        id: crypto.randomUUID(),
        name: data.name,
        color: data.color || colors[Math.floor(Math.random() * colors.length)],
        created_at: now,
    }

    tags.push(tag)
    writeStore('tags', tags)
    return tag
}

export function deleteTag(id: string): boolean {
    const tags = readStore<{ id: string; name: string; color: string; created_at: string }>('tags')
    const index = tags.findIndex(t => t.id === id)
    if (index === -1) return false

    tags.splice(index, 1)
    writeStore('tags', tags)

    // Also remove all business associations
    const businessTags = readStore<BusinessTag>('business_tags')
    const filtered = businessTags.filter(bt => bt.tag_id !== id)
    writeStore('business_tags', filtered)

    return true
}

export function getBusinessTags(businessId: string): { id: string; name: string; color: string; created_at: string }[] {
    const businessTags = readStore<BusinessTag>('business_tags')
    const tags = readStore<{ id: string; name: string; color: string; created_at: string }>('tags')

    const tagIds = businessTags.filter(bt => bt.business_id === businessId).map(bt => bt.tag_id)
    return tags.filter(t => tagIds.includes(t.id))
}

export function addTagToBusiness(businessId: string, tagId: string): BusinessTag | null {
    const businessTags = readStore<BusinessTag>('business_tags')

    if (businessTags.some(bt => bt.business_id === businessId && bt.tag_id === tagId)) {
        return null
    }

    const now = new Date().toISOString()
    const businessTag: BusinessTag = {
        id: crypto.randomUUID(),
        business_id: businessId,
        tag_id: tagId,
        created_at: now,
    }

    businessTags.push(businessTag)
    writeStore('business_tags', businessTags)
    return businessTag
}

export function removeTagFromBusiness(businessId: string, tagId: string): boolean {
    const businessTags = readStore<BusinessTag>('business_tags')
    const index = businessTags.findIndex(bt => bt.business_id === businessId && bt.tag_id === tagId)
    if (index === -1) return false

    businessTags.splice(index, 1)
    writeStore('business_tags', businessTags)
    return true
}

export function getBusinessIdsByTag(tagId: string): string[] {
    const businessTags = readStore<BusinessTag>('business_tags')
    return businessTags.filter(bt => bt.tag_id === tagId).map(bt => bt.business_id)
}
