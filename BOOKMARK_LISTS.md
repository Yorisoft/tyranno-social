# Bookmark Lists Feature

This application implements **NIP-51 Bookmark Sets** (kind 30003) for organizing saved posts into custom lists.

## What Changed

### Before (Old System)
- Single global bookmark list (kind 10003)
- Simple public/private bookmarking
- All bookmarks in one place
- Limited organization

### After (New System)
- **Multiple categorized bookmark lists** (kind 30003)
- Create unlimited custom lists with names and descriptions
- Organize bookmarks by topic, priority, or any criteria
- Public and private items within each list
- Real-time updates via Nostr subscriptions
- Full NIP-51 compliance

## Features

### ✨ Create Custom Lists
- **Unlimited lists**: Create as many bookmark lists as you need
- **Custom names**: "Read Later", "Favorites", "Tech Articles", etc.
- **Descriptions**: Add context to remember what each list is for
- **Images**: (Future) Add cover images to lists

### 🔒 Privacy Options
Each bookmark can be:
- **Public**: Visible on your profile and shareable
- **Private**: Encrypted with NIP-44, only visible to you

### 📱 User Experience
- **Instant updates**: Real-time subscription shows changes immediately
- **Easy organization**: Add posts to multiple lists
- **Quick access**: Sidebar panel with expandable lists
- **Visual feedback**: See item counts and privacy status at a glance

## How It Works

### Creating a List
1. Click bookmark icon on any post
2. Click "Create New List" button
3. Enter a name and optional description
4. List is created and ready to use

### Adding to a List
1. Click bookmark icon on any post
2. Choose an existing list
3. Select "Add as Public" or "Add as Private"
4. Post is instantly added to the list

### Viewing Lists
1. Click "View Lists" in the sidebar
2. Expand any list to see its contents
3. Click any post to view details

### Removing from Lists
- Posts can be removed from lists via the list management interface
- Lists can be deleted (publishes kind 5 deletion event)

## Technical Implementation

### Hooks
- `useBookmarkSets()`: Fetch all bookmark lists for current user
- `useBookmarkSetItems(setId)`: Fetch posts in a specific list
- `useCreateBookmarkSet()`: Create a new list
- `useDeleteBookmarkSet()`: Delete a list
- `useAddToBookmarkSet()`: Add a post to a list
- `useRemoveFromBookmarkSet()`: Remove a post from a list

### Components
- `BookmarkListsDialog`: Main dialog for choosing/creating lists
- `Sidebar` → `BookmarkSetContent`: Display lists in sidebar

### Event Structure (NIP-51)

**Bookmark Set (kind 30003)**:
```json
{
  "kind": 30003,
  "tags": [
    ["d", "unique-list-id"],
    ["title", "Read Later"],
    ["description", "Articles to read this week"],
    ["e", "event-id-1"],
    ["e", "event-id-2"],
    ["a", "30023:pubkey:article-id"]
  ],
  "content": "{encrypted private items}"
}
```

### Real-time Updates
- Subscribes to kind 30003 events from user's relays
- Automatically updates cache when new events arrive
- No manual refresh needed

## NIP-51 Compliance

This implementation follows [NIP-51: Lists](https://github.com/nostr-protocol/nips/blob/master/51.md):

✅ Uses kind 30003 for bookmark sets
✅ Supports `d` tag for addressable events
✅ Supports `title`, `description`, and `image` metadata
✅ Public items in tags, private items encrypted in content
✅ NIP-44 encryption for private items
✅ Deletion via kind 5 events

## Backward Compatibility

The old kind 10003 global bookmark system has been **replaced** with bookmark sets. Users should migrate their bookmarks by:
1. Creating new lists
2. Re-adding important bookmarks

## Future Enhancements

- [ ] Import from kind 10003 global bookmarks
- [ ] List cover images
- [ ] Share lists with others
- [ ] Collaborative lists
- [ ] List templates
- [ ] Bulk operations (move, copy, delete)
- [ ] List search and filtering
- [ ] Export lists as JSON/CSV
- [ ] List statistics and analytics
