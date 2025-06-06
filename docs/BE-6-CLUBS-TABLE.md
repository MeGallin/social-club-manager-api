# Clubs Table Documentation

## Overview

The `public.clubs` table stores core club data for the Social Club Manager platform. This table serves as the foundation for club management, linking clubs to their creators and supporting modular feature configurations.

## Table Schema

### Table: `public.clubs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the club |
| `name` | TEXT | NOT NULL | Name of the club |
| `type` | TEXT | NOT NULL | Club category/type (sports, scouts, hobby, etc.) |
| `description` | TEXT | NULL | Optional club description |
| `logo_url` | TEXT | NULL | Optional URL to club logo image |
| `creator_id` | UUID | REFERENCES auth.users(id) ON DELETE SET NULL | User who created the club |
| `enabled_modules` | JSONB | NULL | Array of enabled feature modules |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT timezone('utc', now()) | Club creation timestamp |

## Indexes

1. **Primary Key**: `id` (UUID)
2. **Unique Index**: `unique_club_name_per_creator` on `(creator_id, lower(name))`
   - Ensures club names are unique per creator (case-insensitive)
3. **Performance Index**: `idx_clubs_creator_id` on `creator_id`
   - Optimizes queries for clubs by creator
4. **Performance Index**: `idx_clubs_type` on `type`
   - Optimizes queries for clubs by type

## Row Level Security (RLS)

RLS is **enabled** on this table with the following policies:

### Read Policy
- **Name**: "Clubs are publicly readable by authenticated users"
- **Operation**: SELECT
- **Users**: authenticated
- **Rule**: `true` (all authenticated users can read all clubs)
- **Purpose**: Allows users to browse and discover clubs for joining

### Insert Policy
- **Name**: "Users can create clubs"
- **Operation**: INSERT
- **Users**: authenticated
- **Rule**: `auth.uid() = creator_id`
- **Purpose**: Users can only create clubs where they are the creator

### Update Policy
- **Name**: "Club creators can update their own clubs"
- **Operation**: UPDATE
- **Users**: authenticated
- **Rule**: `auth.uid() = creator_id`
- **Purpose**: Only club creators can modify their clubs

### Delete Policy
- **Name**: "Club creators can delete their own clubs"
- **Operation**: DELETE
- **Users**: authenticated
- **Rule**: `auth.uid() = creator_id`
- **Purpose**: Only club creators can delete their clubs

## Data Types and Validation

### Club Types
Recommended values for the `type` field:
- `sports` - Sports clubs and teams
- `scouts` - Scouting organizations
- `hobby` - Hobby and interest groups
- `educational` - Educational clubs
- `social` - Social clubs
- `volunteer` - Volunteer organizations
- `professional` - Professional associations
- `other` - Other club types

### Enabled Modules
The `enabled_modules` JSONB field can contain an array of module names:
- `events` - Event management
- `inventory` - Inventory tracking
- `payments` - Payment processing
- `communications` - Member communications
- `member_management` - Member administration
- `reports` - Reporting and analytics
- `documents` - Document management

Example:
```json
["events", "member_management", "communications"]
```

## Usage Examples

### Creating a Club
```sql
INSERT INTO public.clubs (name, type, description, creator_id, enabled_modules)
VALUES (
  'Downtown Soccer Club',
  'sports',
  'A community soccer club for all ages and skill levels',
  'user-uuid-here',
  '["events", "member_management", "communications"]'::jsonb
);
```

### Querying Clubs by Creator
```sql
SELECT * FROM public.clubs 
WHERE creator_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### Querying Clubs by Type
```sql
SELECT * FROM public.clubs 
WHERE type = 'sports'
ORDER BY name;
```

### Searching Clubs by Name
```sql
SELECT * FROM public.clubs 
WHERE LOWER(name) LIKE LOWER('%soccer%')
ORDER BY name;
```

## Security Considerations

1. **Creator Protection**: Only club creators can modify or delete their clubs
2. **Public Discovery**: All authenticated users can view clubs for discovery
3. **Unique Names**: Club names must be unique per creator to avoid confusion
4. **Orphaned Records**: If a creator account is deleted, the club remains but `creator_id` becomes NULL

## Migration Notes

This table was created as part of ticket BE-6. The schema supports:
- MVP functionality for club creation and management
- Future extensibility through the `enabled_modules` JSONB field
- Proper relationships with the authentication system
- Scalable querying through strategic indexes

## Related Files

- SQL Schema: `api/scripts/be-6-clubs-schema.sql`
- Model Definition: `api/src/models/Club.js`
- Implementation Ticket: `api/tickets/BE-6.md`
