# VG-036 Product-Spec Hash Proof

```yaml
record_id: vg-036-product-spec-hash-2026-06-04
gate_id: VG-036
ran_at: 2026-06-04T00:00:00Z
baseline_source: HEAD
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
command: for each HEAD product-spec path, compare `git show HEAD:<path> | sha256sum` with `sha256sum <path>`
hash_comparison:
  - {status: match, head_sha256: 38fda784699e17dc59e6cdbd7dc02defcabe3cf04c375eaf4ff04861d3ca3a6f, current_sha256: 38fda784699e17dc59e6cdbd7dc02defcabe3cf04c375eaf4ff04861d3ca3a6f, path: harness/knowledge/product-specs/atelier/ADAPTER_CONTRACT.md}
  - {status: match, head_sha256: b0d72965f30320c0b3efb0a1386f990333852818e6475a998b196a18da0c10aa, current_sha256: b0d72965f30320c0b3efb0a1386f990333852818e6475a998b196a18da0c10aa, path: harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md}
  - {status: match, head_sha256: f98739c816e3555d4af32b96c56de83d34fcd500d2a22e7d250f05f4d93be568, current_sha256: f98739c816e3555d4af32b96c56de83d34fcd500d2a22e7d250f05f4d93be568, path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md}
  - {status: match, head_sha256: 6cfaa48d7c673f43dd63c637692e62d75b1c15b722934f5325513cb69567e187, current_sha256: 6cfaa48d7c673f43dd63c637692e62d75b1c15b722934f5325513cb69567e187, path: harness/knowledge/product-specs/atelier/EXAMPLES.md}
  - {status: match, head_sha256: d52daee9650ffa666a4075cd70b84c32d0ac5d5826bb169dee34d8c1c2b1abd7, current_sha256: d52daee9650ffa666a4075cd70b84c32d0ac5d5826bb169dee34d8c1c2b1abd7, path: harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md}
  - {status: match, head_sha256: db0203619abca5ec0f4c6d3d4a6248c573d10d8e78f706d0c9e998c544b4987a, current_sha256: db0203619abca5ec0f4c6d3d4a6248c573d10d8e78f706d0c9e998c544b4987a, path: harness/knowledge/product-specs/atelier/HPO_STATE_MODEL.md}
  - {status: match, head_sha256: 02ef4df3d2e37ab498d002526c7014048b785c791f06ea61b525891c09598c2a, current_sha256: 02ef4df3d2e37ab498d002526c7014048b785c791f06ea61b525891c09598c2a, path: harness/knowledge/product-specs/atelier/Ideal.md}
  - {status: match, head_sha256: 8e915c82d92a694068f83de2932839e0f6ea6aa48e8d6987a913eb8868ac8e03, current_sha256: 8e915c82d92a694068f83de2932839e0f6ea6aa48e8d6987a913eb8868ac8e03, path: harness/knowledge/product-specs/atelier/POSITIONING.md}
  - {status: match, head_sha256: b4b9e255aca19579e5a42cf49c979e802c5c5269fea671d0a7392e355410c372, current_sha256: b4b9e255aca19579e5a42cf49c979e802c5c5269fea671d0a7392e355410c372, path: harness/knowledge/product-specs/atelier/README.md}
  - {status: match, head_sha256: e1afdbbf2b7f1ef7eb4933949817f8d683e6a8bc1ab6e2733a102a14eec2830f, current_sha256: e1afdbbf2b7f1ef7eb4933949817f8d683e6a8bc1ab6e2733a102a14eec2830f, path: harness/knowledge/product-specs/atelier/ROADMAP.md}
  - {status: match, head_sha256: 91f9e4d38e9c7743df9238391044d26e4f6baa27841c08892cd84447140b3087, current_sha256: 91f9e4d38e9c7743df9238391044d26e4f6baa27841c08892cd84447140b3087, path: harness/knowledge/product-specs/atelier/RUN_PACKET_MODEL.md}
  - {status: match, head_sha256: fed0f2722ba5d1770e8f13ec4cd69f42d9526b8bb3685e009bba4341d1607b50, current_sha256: fed0f2722ba5d1770e8f13ec4cd69f42d9526b8bb3685e009bba4341d1607b50, path: harness/knowledge/product-specs/atelier/SURFACES.md}
  - {status: match, head_sha256: a76941b847736113ec72d93b52d9aafb58a537694920a1b15bf7c6455887dc6d, current_sha256: a76941b847736113ec72d93b52d9aafb58a537694920a1b15bf7c6455887dc6d, path: harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md}
  - {status: match, head_sha256: 782ccec52f32fd2bf1ae018745610ef683f36eaab7407d83fc9aea3a372b2fa7, current_sha256: 782ccec52f32fd2bf1ae018745610ef683f36eaab7407d83fc9aea3a372b2fa7, path: harness/knowledge/product-specs/atelier/WRITE_AUTHORITY_MATRIX.md}
  - {status: match, head_sha256: 3de22827caa36c052c26ed7ad459c09f264077b9230ab1a40051e12231b78c53, current_sha256: 3de22827caa36c052c26ed7ad459c09f264077b9230ab1a40051e12231b78c53, path: harness/knowledge/product-specs/atelier/contract.md}
result_summary: All current product-spec hashes match HEAD hashes.
product_specs_touched: false
```
