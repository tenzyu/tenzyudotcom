# Atelier Implementation Control

This root is a thin entrypoint. Machine-queryable truth lives in `canonical/**` and `state/**`.
Generated human views live in `views/**`.

Start here:

```bash
bun run resume
bun run frontier
bun run packet -- --dag <DAG-ID> --format md
```

Do not read legacy root docs during ordinary implementation. Legacy material is archived under `state/legacy/**` or `archive/**`.
