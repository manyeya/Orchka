# Expression Engine Guide

A powerful expression system using JSONata for dynamic value resolution in Flowbase workflows.

## Quick Start

Expressions are wrapped in double curly braces `{{ }}` and can be used in any text field within node configurations.

```js
// Access data from previous node
{{ input.userName }}

// Access specific node's output
{{ $node("HTTP Request").users[0].name }}

// Use built-in functions
{{ $uppercase(input.name) }}
```

---

## Expression Syntax

The expression engine uses [JSONata](https://jsonata.org/), a lightweight query and transformation language for JSON data. JSONata provides XPath-like navigation with powerful built-in functions.

### 1. Direct Data Access (`input`)

Access the previous node's output data directly:

```js
// Simple field access
{{ input.email }}

// Nested objects
{{ input.user.profile.name }}

// Array access
{{ input.items[0].id }}
{{ input.users[2].email }}

// Mixed notation
{{ input.data.results[0].metadata.tags[1] }}
```

### 2. Special Character Property Access

When property names contain special characters (hyphens, spaces, dots), use backtick notation:

```js
// Property with hyphen
{{ input.`field-name` }}

// Property with space
{{ input.`my field` }}

// Property with dot
{{ input.`file.name` }}
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
| `input` | Previous node's output | `{{ input.id }}` |
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
{{ input.status = "active" }}
{{ input.count != 0 }}

// Numeric comparisons
{{ input.price > 100 }}
{{ input.quantity >= 10 }}
{{ input.age < 18 }}
{{ input.score <= 50 }}
```

### Logical Operators

```js
// AND - both conditions must be true
{{ input.active and input.verified }}

// OR - at least one condition must be true
{{ input.admin or input.moderator }}

// NOT - negates the condition
{{ not input.disabled }}

// Combined
{{ (input.role = "admin" or input.role = "owner") and input.active }}
```

### Ternary Operator

```js
// condition ? trueValue : falseValue
{{ input.active ? "Active" : "Inactive" }}

// Nested ternary
{{ input.score > 90 ? "A" : input.score > 80 ? "B" : "C" }}
```

### Array Membership (`in`)

```js
// Check if value exists in array
{{ input.status in ["pending", "processing"] }}

// Check if item is in a list
{{ "admin" in input.roles }}
```

---

## Built-in Functions

JSONata provides a rich set of built-in functions. Here are the most commonly used ones:

### String Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$uppercase(str)` | Convert to uppercase | `{{ $uppercase(input.name) }}` → `"JOHN"` |
| `$lowercase(str)` | Convert to lowercase | `{{ $lowercase(input.email) }}` → `"john@example.com"` |
| `$trim(str)` | Remove leading/trailing whitespace | `{{ $trim(input.input) }}` |
| `$substring(str, start, length)` | Extract substring | `{{ $substring(input.text, 0, 10) }}` |
| `$replace(str, pattern, replacement)` | Replace text | `{{ $replace(input.text, "old", "new") }}` |
| `$split(str, separator)` | Split string to array | `{{ $split(input.csv, ",") }}` |
| `$join(array, separator)` | Join array to string | `{{ $join(input.tags, ", ") }}` |
| `$contains(str, substring)` | Check if contains | `{{ $contains(input.email, "@") }}` |
| `$length(str)` | String length | `{{ $length(input.name) }}` |

### Math Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$sum(array)` | Sum of numbers | `{{ $sum(input.prices) }}` |
| `$average(array)` | Average of numbers | `{{ $average(input.scores) }}` |
| `$min(array)` | Minimum value | `{{ $min(input.values) }}` |
| `$max(array)` | Maximum value | `{{ $max(input.values) }}` |
| `$round(num, precision)` | Round number | `{{ $round(input.price, 2) }}` |
| `$floor(num)` | Round down | `{{ $floor(input.value) }}` |
| `$ceil(num)` | Round up | `{{ $ceil(input.value) }}` |
| `$abs(num)` | Absolute value | `{{ $abs(input.delta) }}` |
| `$power(base, exp)` | Exponentiation | `{{ $power(2, 8) }}` → `256` |
| `$sqrt(num)` | Square root | `{{ $sqrt(16) }}` → `4` |

### Array Functions

| Function | Description | Example |
|----------|-------------|---------|
| `$count(array)` | Array length | `{{ $count(input.items) }}` |
| `$append(arr1, arr2)` | Concatenate arrays | `{{ $append(input.list1, input.list2) }}` |
| `$sort(array)` | Sort array | `{{ $sort(input.names) }}` |
| `$reverse(array)` | Reverse array | `{{ $reverse(input.items) }}` |
| `$distinct(array)` | Remove duplicates | `{{ $distinct(input.tags) }}` |
| `$shuffle(array)` | Randomize order | `{{ $shuffle(input.items) }}` |

### Higher-Order Functions

```js
// $map - transform each element
{{ $map(input.users, function($v) { $v.name }) }}

// $filter - keep elements matching condition
{{ $filter(input.users, function($v) { $v.active = true }) }}

// $reduce - accumulate values
{{ $reduce(input.numbers, function($acc, $v) { $acc + $v }, 0) }}
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
| `$keys(obj)` | Get object keys | `{{ $keys(input.data) }}` |
| `$values(obj)` | Get object values | `{{ $values(input.data) }}` |
| `$merge(obj1, obj2)` | Merge objects | `{{ $merge(input.defaults, input.overrides) }}` |
| `$type(value)` | Get value type | `{{ $type(input.field) }}` |
| `$exists(value)` | Check if defined | `{{ $exists(input.optional) }}` |

---

## Expression Behavior

### Single Expression (Native Type Preservation)

When a field contains only a single expression, the native type is preserved:

```js
// Returns number, not string
{{ input.count }}  // → 42

// Returns array
{{ input.items }}  // → ["a", "b", "c"]

// Returns object
{{ input.user }}   // → { name: "John", age: 30 }

// Returns boolean
{{ input.active }} // → true
```

### Mixed Content (String Concatenation)

When text is mixed with expressions, the result is always a string:

```js
// Returns string
"Hello {{ input.name }}!"  // → "Hello John!"

// Multiple expressions become concatenated string
"{{ input.firstName }} {{ input.lastName }}"  // → "John Doe"
```

### Undefined Values

When accessing undefined paths, JSONata returns `undefined` (not an error):

```js
// Returns undefined if path doesn't exist
{{ input.nonexistent.path }}  // → undefined

// Use default values with ternary
{{ input.name ? input.name : "Unknown" }}
```

---

## Examples

### HTTP Request with Dynamic URL

```
URL: https://api.example.com/users/{{ input.userId }}
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
Hello {{ input.firstName }}!

Your order #{{ input.orderId }} has been {{ $lowercase(input.status) }}.

Total: ${{ input.total }}
```

### Array Processing

```js
// Count items
{{ $count(input.users) }}

// Get all names
{{ $map(input.users, function($u) { $u.name }) }}

// Filter active users
{{ $filter(input.users, function($u) { $u.active }) }}

// Sum prices
{{ $sum(input.items.price) }}
```

### Conditional Logic (for If/Switch nodes)

```js
// Simple condition
{{ input.status = "approved" }}

// Complex condition
{{ input.amount > 1000 and input.verified = true }}

// Check array membership
{{ input.role in ["admin", "moderator"] }}
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
| `{{ $json.field }}` | `{{ input.field }}` |
| `{{ json.field }}` | `{{ input.field }}` |
| `{{ $("Node Name").item.json }}` | `{{ $node("Node Name") }}` |
| `{{ $node["Node Name"].json }}` | `{{ $node("Node Name") }}` |
| `{{ $input.item.json }}` | `{{ input }}` |

### Helper Functions

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $uppercase $json.name }}` | `{{ $uppercase(input.name) }}` |
| `{{ $lowercase $json.email }}` | `{{ $lowercase(input.email) }}` |
| `{{ $length $json.items }}` | `{{ $count(input.items) }}` |
| `{{ $first $json.items }}` | `{{ input.items[0] }}` |
| `{{ $last $json.items }}` | `{{ input.items[-1] }}` |
| `{{ $add $json.a $json.b }}` | `{{ input.a + input.b }}` |
| `{{ $subtract $json.a $json.b }}` | `{{ input.a - input.b }}` |
| `{{ $multiply $json.a $json.b }}` | `{{ input.a * input.b }}` |
| `{{ $divide $json.a $json.b }}` | `{{ input.a / input.b }}` |

### Conditionals

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $if $json.active "Yes" "No" }}` | `{{ input.active ? "Yes" : "No" }}` |
| `{{ $eq $json.status "done" }}` | `{{ input.status = "done" }}` |
| `{{ $ne $json.status "pending" }}` | `{{ input.status != "pending" }}` |
| `{{ $gt $json.count 10 }}` | `{{ input.count > 10 }}` |
| `{{ $and $json.a $json.b }}` | `{{ input.a and input.b }}` |
| `{{ $or $json.a $json.b }}` | `{{ input.a or input.b }}` |
| `{{ $not $json.disabled }}` | `{{ not input.disabled }}` |

### Array Operations

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $filter $json.users "active" true }}` | `{{ $filter(input.users, function($v) { $v.active = true }) }}` |
| `{{ $pluck $json.users "email" }}` | `{{ input.users.email }}` or `{{ $map(input.users, function($v) { $v.email }) }}` |
| `{{ $find $json.users "id" 123 }}` | `{{ input.users[id = 123] }}` |
| `{{ $sort $json.items "name" }}` | `{{ $sort(input.items, function($a, $b) { $a.name > $b.name }) }}` |
| `{{ $unique $json.tags }}` | `{{ $distinct(input.tags) }}` |

### JSON Operations

| Old Syntax | New Syntax |
|------------|------------|
| `{{ $stringify $json.data }}` | `{{ $string(input.data) }}` |
| `{{ $keys $json.object }}` | `{{ $keys(input.object) }}` |
| `{{ $values $json.object }}` | `{{ $values(input.object) }}` |
| `{{ $merge $json.obj1 $json.obj2 }}` | `{{ $merge([input.obj1, input.obj2]) }}` |

---

## Best Practices

1. **Use descriptive node names** - Name your nodes clearly to make `$node()` references readable
2. **Prefer `input` for simple cases** - When accessing the previous node's data
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
Expression: {{ input.users[0 }}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Expression returns `undefined` | Check if the property path exists in the data |
| Array index out of bounds | Use `$count()` to check array size first |
| Type mismatch | Use `$type()` to check value type |
| Node not found | Ensure the referenced node exists and has executed |
| Special characters in property name | Use backtick notation: `` input.`field-name` `` |
| Syntax error | Check for matching brackets, quotes, and parentheses |

---

## JSONata Resources

For more advanced JSONata features, refer to:
- [JSONata Documentation](https://docs.jsonata.org/)
- [JSONata Exerciser](https://try.jsonata.org/) - Interactive playground to test expressions
