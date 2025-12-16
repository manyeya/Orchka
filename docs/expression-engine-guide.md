# Expression Engine Guide

A powerful expression system using JSONata for dynamic value resolution in Flowbase workflows.

## Quick Start

Expressions are wrapped in double curly braces `{{ }}` and can be used in any text field within node configurations.

```js
// Access data from previous node
{{ json.userName }}

// Access specific node's output
{{ $node("HTTP Request").users[0].name }}

// Use built-in functions
{{ $uppercase(json.name) }}
```

---

## Expression Syntax

The expression engine uses [JSONata](https://jsonata.org/), a lightweight query and transformation language for JSON data. JSONata provides XPath-like navigation with powerful built-in functions.

### 1. Direct Data Access (`json`)

Access the previous node's output data directly:

```js
// Simple field access
{{ json.email }}

// Nested objects
{{ json.user.profile.name }}

// Array access
{{ json.items[0].id }}
{{ json.users[2].email }}

// Mixed notation
{{ json.data.results[0].metadata.tags[1] }}
```

### 2. Special Character Property Access

When property names contain special characters (hyphens, spaces, dots), use backtick notation:

```js
// Property with hyphen
{{ json.`field-name` }}

// Property with space
{{ json.`my field` }}

// Property with dot
{{ json.`file.name` }}
```

### 3. Node References (`$node`)

Access output from any specific node by name:

```js
// Get data from a specific node
{{ $node("HTTP Request") }}

// Access nested properties
{{ $node("HTTP Request").response.body }}

// Array access within node data
{{ $node("Webhook Trigger").items[0] }}

// Combine with functions
{{ $count($node("Get Users").users) }}
```

**Note:** If the referenced node doesn't exist or hasn't executed yet, `$node()` returns `undefined`.

---

## Built-in Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `json` | Previous node's output | `{{ json.id }}` |
| `workflow.id` | Current workflow ID | `{{ workflow.id }}` |
| `workflow.name` | Workflow name | `{{ workflow.name }}` |
| `execution.id` | Execution ID | `{{ execution.id }}` |
| `execution.startedAt` | Execution start time | `{{ execution.startedAt }}` |
| `now` | Current timestamp (ms) | `{{ now }}` |
| `today` | Today's date (YYYY-MM-DD) | `{{ today }}` |
| `env.VAR_NAME` | Environment variables | `{{ env.API_KEY }}` |
| `branch.last` | Most recent branch decision | `{{ branch.last.branch }}` |
| `branch.all` | All branch decisions by node ID | `{{ branch.all }}` |

---

## Operators

### Comparison Operators

```js
// Equality
{{ json.status = "active" }}
{{ json.count != 0 }}

// Numeric comparisons
{{ json.price > 100 }}
{{ json.quantity >= 10 }}
{{ json.age < 18 }}
{{ json.score <= 50 }}
```

### Logical Operators

```js
// AND - both conditions must be true
{{ json.active and json.verified }}

// OR - at least one condition must be true
{{ json.admin or json.moderator }}

// NOT - negates the condition
{{ not json.disabled }}

// Combined
{{ (json.role = "admin" or json.role = "owner") and json.active }}
```

### Ternary Operator

```js
// condition ? trueValue : falseValue
{{ json.active ? "Active" : "Inactive" }}

// Nested ternary
{{ json.score > 90 ? "A" : json.score > 80 ? "B" : "C" }}
```

### Array Membership (`in`)

```js
// Check if value exists in array
{{ json.status in ["pending", "processing"] }}

// Check if item is in a list
{{ "admin" in json.roles }}
```

---

## Built-in Functions

JSONata provides a rich set of built-in functions. Here are the most commonly used ones:

### String Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$uppercase(str)` | Convert to uppercase | `{{ $uppercase(json.name) }}` → `"JOHN"` |
| `$lowercase(str)` | Convert to lowercase | `{{ $lowercase(json.email) }}` → `"john@example.com"` |
| `$trim(str)` | Remove leading/trailing whitespace | `{{ $trim(json.input) }}` |
| `$substring(str, start, length)` | Extract substring | `{{ $substring(json.text, 0, 10) }}` |
| `$replace(str, pattern, replacement)` | Replace text | `{{ $replace(json.text, "old", "new") }}` |
| `$split(str, separator)` | Split string to array | `{{ $split(json.csv, ",") }}` |
| `$join(array, separator)` | Join array to string | `{{ $join(json.tags, ", ") }}` |
| `$contains(str, substring)` | Check if contains | `{{ $contains(json.email, "@") }}` |
| `$length(str)` | String length | `{{ $length(json.name) }}` |

### Math Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$sum(array)` | Sum of numbers | `{{ $sum(json.prices) }}` |
| `$average(array)` | Average of numbers | `{{ $average(json.scores) }}` |
| `$min(array)` | Minimum value | `{{ $min(json.values) }}` |
| `$max(array)` | Maximum value | `{{ $max(json.values) }}` |
| `$round(num, precision)` | Round number | `{{ $round(json.price, 2) }}` |
| `$floor(num)` | Round down | `{{ $floor(json.value) }}` |
| `$ceil(num)` | Round up | `{{ $ceil(json.value) }}` |
| `$abs(num)` | Absolute value | `{{ $abs(json.delta) }}` |
| `$power(base, exp)` | Exponentiation | `{{ $power(2, 8) }}` → `256` |
| `$sqrt(num)` | Square root | `{{ $sqrt(16) }}` → `4` |

### Array Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$count(array)` | Array length | `{{ $count(json.items) }}` |
| `$append(arr1, arr2)` | Concatenate arrays | `{{ $append(json.list1, json.list2) }}` |
| `$sort(array)` | Sort array | `{{ $sort(json.names) }}` |
| `$reverse(array)` | Reverse array | `{{ $reverse(json.items) }}` |
| `$distinct(array)` | Remove duplicates | `{{ $distinct(json.tags) }}` |
| `$shuffle(array)` | Randomize order | `{{ $shuffle(json.items) }}` |

### Higher-Order Functions

```js
// $map - transform each element
{{ $map(json.users, function($v) { $v.name }) }}

// $filter - keep elements matching condition
{{ $filter(json.users, function($v) { $v.active = true }) }}

// $reduce - accumulate values
{{ $reduce(json.numbers, function($acc, $v) { $acc + $v }, 0) }}
```

### Date Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$now()` | Current timestamp (ISO string) | `{{ $now() }}` |
| `$millis()` | Current time in milliseconds | `{{ $millis() }}` |
| `$toMillis(str)` | Parse date to milliseconds | `{{ $toMillis("2024-01-15") }}` |
| `$fromMillis(ms)` | Format milliseconds to ISO | `{{ $fromMillis(now) }}` |

### Object Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$keys(obj)` | Get object keys | `{{ $keys(json.data) }}` |
| `$values(obj)` | Get object values | `{{ $values(json.data) }}` |
| `$merge(obj1, obj2)` | Merge objects | `{{ $merge(json.defaults, json.overrides) }}` |
| `$type(value)` | Get value type | `{{ $type(json.field) }}` |
| `$exists(value)` | Check if defined | `{{ $exists(json.optional) }}` |

---

## Expression Behavior

### Single Expression (Native Type Preservation)

When a field contains only a single expression, the native type is preserved:

```js
// Returns number, not string
{{ json.count }}  // → 42

// Returns array
{{ json.items }}  // → ["a", "b", "c"]

// Returns object
{{ json.user }}   // → { name: "John", age: 30 }

// Returns boolean
{{ json.active }} // → true
```

### Mixed Content (String Concatenation)

When text is mixed with expressions, the result is always a string:

```js
// Returns string
"Hello {{ json.name }}!"  // → "Hello John!"

// Multiple expressions become concatenated string
"{{ json.firstName }} {{ json.lastName }}"  // → "John Doe"
```

### Undefined Values

When accessing undefined paths, JSONata returns `undefined` (not an error):

```js
// Returns undefined if path doesn't exist
{{ json.nonexistent.path }}  // → undefined

// Use default values with ternary
{{ json.name ? json.name : "Unknown" }}
```

---

## Examples

### HTTP Request with Dynamic URL

```
URL: https://api.example.com/users/{{ json.userId }}
```

### Conditional Headers

```json
{
  "Authorization": "Bearer {{ $node("Auth Node").token }}",
  "Content-Type": "application/json"
}
```

### Building a Message

```
Hello {{ json.firstName }}!

Your order #{{ json.orderId }} has been {{ $lowercase(json.status) }}.

Total: ${{ json.total }}
```

### Array Processing

```js
// Count items
{{ $count(json.users) }}

// Get all names
{{ $map(json.users, function($u) { $u.name }) }}

// Filter active users
{{ $filter(json.users, function($u) { $u.active }) }}

// Sum prices
{{ $sum(json.items.price) }}
```

### Conditional Logic (for If/Switch nodes)

```js
// Simple condition
{{ json.status = "approved" }}

// Complex condition
{{ json.amount > 1000 and json.verified = true }}

// Check array membership
{{ json.role in ["admin", "moderator"] }}
```

### Working with Branch Context

```js
// Access the last branch decision
{{ branch.last.branch }}  // → "true" or "false" for If nodes

// Check which branch was taken
{{ branch.last.branch = "true" ? "Approved" : "Rejected" }}

// Access loop iteration info
{{ branch.last.iteration.index }}  // Current iteration index
{{ branch.last.iteration.total }}  // Total iterations
{{ branch.last.iteration.item }}   // Current item being processed
```

### Combining Data from Multiple Nodes

```json
{
  "user": "{{ $node('Get User') }}",
  "orderCount": "{{ $count($node('Get Orders').items) }}",
  "summary": "{{ $node('Get User').name }} has {{ $count($node('Get Orders').items) }} orders"
}
```

---

## Migration from Old Syntax

If you're migrating from the previous Handlebars-based expression engine, here are the key changes:

### Data Access

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $json.field }}` | `{{ json.field }}` |
| `{{ $("Node Name").item.json }}` | `{{ $node("Node Name") }}` |
| `{{ $node["Node Name"].json }}` | `{{ $node("Node Name") }}` |
| `{{ $input.item.json }}` | `{{ json }}` |

### Helper Functions

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $uppercase $json.name }}` | `{{ $uppercase(json.name) }}` |
| `{{ $lowercase $json.email }}` | `{{ $lowercase(json.email) }}` |
| `{{ $length $json.items }}` | `{{ $count(json.items) }}` |
| `{{ $first $json.items }}` | `{{ json.items[0] }}` |
| `{{ $last $json.items }}` | `{{ json.items[-1] }}` |
| `{{ $add $json.a $json.b }}` | `{{ json.a + json.b }}` |
| `{{ $subtract $json.a $json.b }}` | `{{ json.a - json.b }}` |
| `{{ $multiply $json.a $json.b }}` | `{{ json.a * json.b }}` |
| `{{ $divide $json.a $json.b }}` | `{{ json.a / json.b }}` |

### Conditionals

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $if $json.active "Yes" "No" }}` | `{{ json.active ? "Yes" : "No" }}` |
| `{{ $eq $json.status "done" }}` | `{{ json.status = "done" }}` |
| `{{ $ne $json.status "pending" }}` | `{{ json.status != "pending" }}` |
| `{{ $gt $json.count 10 }}` | `{{ json.count > 10 }}` |
| `{{ $and $json.a $json.b }}` | `{{ json.a and json.b }}` |
| `{{ $or $json.a $json.b }}` | `{{ json.a or json.b }}` |
| `{{ $not $json.disabled }}` | `{{ not json.disabled }}` |

### Array Operations

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $filter $json.users "active" true }}` | `{{ $filter(json.users, function($v) { $v.active = true }) }}` |
| `{{ $pluck $json.users "email" }}` | `{{ json.users.email }}` or `{{ $map(json.users, function($v) { $v.email }) }}` |
| `{{ $find $json.users "id" 123 }}` | `{{ json.users[id = 123] }}` |
| `{{ $sort $json.items "name" }}` | `{{ $sort(json.items, function($a, $b) { $a.name > $b.name }) }}` |
| `{{ $unique $json.tags }}` | `{{ $distinct(json.tags) }}` |

### JSON Operations

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $stringify $json.data }}` | `{{ $string(json.data) }}` |
| `{{ $keys $json.object }}` | `{{ $keys(json.object) }}` |
| `{{ $values $json.object }}` | `{{ $values(json.object) }}` |
| `{{ $merge $json.obj1 $json.obj2 }}` | `{{ $merge([json.obj1, json.obj2]) }}` |

---

## Best Practices

1. **Use descriptive node names** - Name your nodes clearly to make `$node()` references readable
2. **Prefer `json` for simple cases** - When accessing the previous node's data
3. **Use `$node()` for specific nodes** - When you need data from a non-adjacent node
4. **Handle undefined values** - Use ternary operator or `$exists()` to handle missing data
5. **Test expressions** - Verify expressions work with sample data before running workflows
6. **Use backticks for special characters** - When property names contain hyphens, spaces, or dots

---

## Error Handling

When an expression has a syntax error, the engine throws an `ExpressionError` with:
- The error message describing what went wrong
- The position in the expression where the error occurred
- The original expression text

Example error:
```
Expression error at position 15: Expected '}' but found end of expression
Expression: {{ json.users[0 }}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Expression returns `undefined` | Check if the property path exists in the data |
| Array index out of bounds | Use `$count()` to check array size first |
| Type mismatch | Use `$type()` to check value type |
| Node not found | Ensure the referenced node exists and has executed |
| Special characters in property name | Use backtick notation: `` json.`field-name` `` |
| Syntax error | Check for matching brackets, quotes, and parentheses |

---

## JSONata Resources

For more advanced JSONata features, refer to:
- [JSONata Documentation](https://docs.jsonata.org/)
- [JSONata Exerciser](https://try.jsonata.org/) - Interactive playground to test expressions
