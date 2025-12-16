# Expression Engine Guide

A powerful templating system for dynamic expression resolution in Flowbase workflows. 

## Quick Start

Expressions are wrapped in double curly braces `{{ }}` and can be used in any text field within node configurations.

```js
// Access data from previous node
{{ $json.userName }}

// Access specific node's output
{{ $("HTTP Request").item.json.users[0].name }}
```

---

## Expression Syntax

### 1. Direct Data Access (`$json`)

Access the previous node's output data directly:

```js
// Simple field access
{{ $json.email }}

// Nested objects
{{ $json.user.profile.name }}

// Array access
{{ $json.items[0].id }}
{{ $json.users[2].email }}

// Mixed notation
{{ $json.data.results[0].metadata.tags[1] }}
```

### 2. Node References (`$()`)

Access output from any specific node by name:

```js
// Get data from a specific node
{{ $("HTTP Request").item.json }}

// Access nested properties
{{ $("HTTP Request").item.json.response.body }}

// Array access within node data
{{ $("Webhook Trigger").item.json.items[0] }}
```

**Node Reference Methods:**

| Method | Description |
|--------|-------------|
| `.item` | Get the first item |
| `.all()` | Get all items as array |
| `.first()` | Get the first item |
| `.last()` | Get the last item |

```js
// Get all items from a node
{{ $("HTTP Request").all() }}

// Get the last item
{{ $("Loop Node").last().json.value }}
```

### 3. Alternative Node Access (`$node`)

Access node data using bracket notation:

```js
{{ $node["HTTP Request"].json.field }}
{{ $node["My Node"].item.json.data }}
```

### 4. Input Helper (`$input`)

Access the current node's input data (same as `$json`):

```js
{{ $input.item.json.field }}
{{ $input.all() }}
{{ $input.first().json.name }}
```

---

## Built-in Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$json` | Previous node's output | `{{ $json.id }}` |
| `$workflow.id` | Current workflow ID | `{{ $workflow.id }}` |
| `$workflow.name` | Workflow name | `{{ $workflow.name }}` |
| `$execution.id` | Execution ID | `{{ $execution.id }}` |
| `$execution.startedAt` | Execution start time | `{{ $execution.startedAt }}` |
| `$now` | Current timestamp | `{{ $now }}` |
| `$today` | Today's date (YYYY-MM-DD) | `{{ $today }}` |
| `$env` | Environment variables | `{{ $env.API_KEY }}` |

---

## Handlebars Helpers

Helpers are functions that transform data. They use the syntax `{{ $helperName value }}`.

### String Helpers

```js
{{ $uppercase $json.name }}          // "JOHN"
{{ $lowercase $json.email }}         // "john@example.com"
{{ $capitalize $json.title }}        // "Hello world" → "Hello world"
{{ $trim $json.input }}              // Removes whitespace
{{ $replace $json.text "old" "new" }}
{{ $substring $json.text 0 10 }}     // First 10 characters
{{ $split $json.csv "," }}           // Split to array
{{ $join $json.tags ", " }}          // Array to string
```

### Math Helpers

```js
{{ $add $json.price 10 }}            // Addition
{{ $subtract $json.total 5 }}        // Subtraction
{{ $multiply $json.qty 2 }}          // Multiplication
{{ $divide $json.amount 100 }}       // Division
{{ $round $json.value }}             // Round to nearest integer
{{ $floor $json.number }}            // Round down
{{ $ceil $json.number }}             // Round up
{{ $abs $json.delta }}               // Absolute value
{{ $min $json.a $json.b }}           // Minimum value
{{ $max $json.a $json.b }}           // Maximum value
```

### Array Helpers

```js
{{ $first $json.items }}             // First item
{{ $last $json.items }}              // Last item
{{ $length $json.items }}            // Array length
{{ $filter $json.users "active" true }}  // Filter by property
{{ $find $json.users "id" 123 }}     // Find by property
{{ $pluck $json.users "email" }}     // Extract property values
{{ $unique $json.tags }}             // Remove duplicates
{{ $sort $json.items "name" }}       // Sort by property
{{ $reverse $json.items }}           // Reverse array
{{ $slice $json.items 0 5 }}         // Slice array
```

### Logic Helpers

```js
{{ $if $json.active "Yes" "No" }}    // Conditional
{{ $eq $json.status "done" }}        // Equals
{{ $ne $json.status "pending" }}     // Not equals
{{ $gt $json.count 10 }}             // Greater than
{{ $gte $json.count 10 }}            // Greater or equal
{{ $lt $json.count 5 }}              // Less than
{{ $lte $json.count 5 }}             // Less or equal
{{ $and $json.a $json.b }}           // Logical AND
{{ $or $json.a $json.b }}            // Logical OR
{{ $not $json.disabled }}            // Logical NOT
{{ $isEmpty $json.items }}           // Check if empty
{{ $isDefined $json.field }}         // Check if defined
{{ $default $json.value "fallback" }} // Default value
```

### JSON Helpers

```js
{{ $stringify $json.data }}          // Object to JSON string
{{ $parse $json.jsonString }}        // JSON string to object
{{ $merge $json.obj1 $json.obj2 }}   // Merge objects
{{ $keys $json.object }}             // Get object keys
{{ $values $json.object }}           // Get object values
```

---

## Examples

### HTTP Request with Dynamic URL

```
URL: https://api.example.com/users/{{ $json.userId }}
```

### Conditional Headers

```json
{
  "Authorization": "Bearer {{ $("Auth Node").item.json.token }}",
  "Content-Type": "application/json"
}
```

### Building a Message

```
Hello {{ $json.firstName }}!

Your order #{{ $json.orderId }} has been {{ $lowercase $json.status }}.

Total: ${{ $json.total }}
```

### Array Processing

```js
// Get emails from users array
{{ $pluck $("Get Users").item.json.users "email" }}

// Filter active users
{{ $filter $json.users "status" "active" }}

// Get first user's name
{{ $first $json.users }}
```

### Chaining with Multiple Nodes

```js
// Combine data from multiple nodes
{
  "user": {{ $("Get User").item.json }},
  "orders": {{ $("Get Orders").item.json.items }},
  "summary": "{{ $("Get User").item.json.name }} has {{ $length $("Get Orders").item.json.items }} orders"
}
```

---

## Best Practices

1. **Use specific node names** - Name your nodes descriptively to make expressions readable
2. **Prefer `$json` for simple cases** - When accessing the previous node's data
3. **Use `$()` for specific nodes** - When you need data from a non-adjacent node
4. **Handle missing data** - Use `$default` or `$isDefined` to handle undefined values
5. **Test expressions** - Verify expressions work with sample data before running workflows

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Expression returns `undefined` | Check if the node name or property path is correct |
| Array index out of bounds | Use `$length` to check array size first |
| Type mismatch | Use `$stringify` or `$parse` to convert types |
| Node not found | Ensure the referenced node exists and has executed |
