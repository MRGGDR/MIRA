# API Apps Script

Todas las respuestas usan el contrato:

```json
{ "ok": true, "data": {}, "meta": {} }
```

o:

```json
{
  "ok": false,
  "error": {
    "code": "ACTION_NOT_FOUND",
    "message": "No se encontro la accion solicitada.",
    "details": {}
  }
}
```

## Operaciones

- `health`
- `bootstrap`
- `getParameters`
- `listActions`
- `getAction`
- `createAction`
- `updateAction`
- `getStats`
- `getAudit`

El frontend invoca estas operaciones por `POST` enviando:

```json
{
  "action": "getAction",
  "params": { "id": 154 },
  "data": {}
}
```

La busqueda por ID es exacta: `Number(rowId) === Number(requestedId)`.
