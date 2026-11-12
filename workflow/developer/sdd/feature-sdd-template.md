# Feature SDD: [feature name]

## 1. Problem and outcome

What user problem does this solve? What observable outcome should change?

## 2. Actors and permissions

| Actor | Allowed actions | Forbidden actions |
| --- | --- | --- |
| Developer |  |  |
| Bug Reporter |  |  |
| QA Tester |  |  |

## 3. User journey

1. 
2. 
3. 

## 4. State transitions

```text
[state] → [state]
```

Document who may cause each transition and what happens on failure.

## 5. Data model

List tables, columns, constraints, indexes, immutable fields, and revision/audit requirements.

## 6. Application contracts

Define server actions or route handlers, validated inputs, outputs, errors, and client/server
boundaries.

## 7. AI context and resource policy

- Relevant context only:
- Trusted context:
- Untrusted context:
- Input limits:
- Output schema:
- Model/cache/rate-limit policy:
- What the AI must never do:

## 8. Security requirements

- [ ] Authentication and role checks
- [ ] Assignment or ownership checks
- [ ] RLS policies and negative tests
- [ ] Original data cannot be overwritten
- [ ] Untrusted text cannot become instructions
- [ ] Secrets remain server-side
- [ ] No automatic execution of submitted/generated code

## 9. UI states

- Loading:
- Empty:
- Permission denied:
- Validation error:
- Server/AI error:
- Success:

## 10. Acceptance criteria

- [ ] 
- [ ] 
- [ ] 

## 11. Test cases

### Happy path

- 

### Authorization and security

- 

### Failure and edge cases

- 

## 12. Out of scope

- 
