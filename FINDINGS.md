# Findings

## Telemetry Evidence

See telemetry.log for raw evidence. Example entries:

```
{"timestamp":"2025-12-18T21:29:51.125Z","path":"/login","status":401,"event_type":"login_attempt","result":"failure","reason":"no_such_user",...}
{"timestamp":"2025-12-18T21:30:35.446Z","path":"/internal/reports","status":200,"event_type":"internal_route_access","result":"success","reason":"vuln_authz_bypass",...}
```

- User enumeration, brute force, and authz bypass evidenced above.
