"""SDXL long-prompt conditioning without changing CLIP's positional window."""
import math

MAX_PROMPT_TOKENS = 220
ENCODING_VERSION = 'sdxl-chunks-v1'


def tokenize_prompts(tokenizers, prompt, negative_prompt):
    # We split these IDs before calling CLIP; its unsplit-length warning does not apply.
    positive = [tokenizer(prompt, add_special_tokens=False, truncation=False, verbose=False).input_ids for tokenizer in tokenizers]
    negative = [tokenizer(negative_prompt, add_special_tokens=False, truncation=False, verbose=False).input_ids for tokenizer in tokenizers]
    return positive, negative


def prompt_counts(tokenizers, prompt, negative_prompt):
    positive, negative = tokenize_prompts(tokenizers, prompt, negative_prompt)
    return {'positive': max(map(len, positive)), 'negative': max(map(len, negative)),
            'positive_encoders': list(map(len, positive)), 'negative_encoders': list(map(len, negative)),
            'limit': MAX_PROMPT_TOKENS}


def validate_tokens(positive, negative):
    for label, sequences in [('combinado', positive), ('negativo', negative)]:
        count = max(map(len, sequences))
        if count > MAX_PROMPT_TOKENS:
            raise ValueError(f'Prompt {label} demasiado largo: {count}/{MAX_PROMPT_TOKENS} tokens. No se ha truncado; acorta el texto.')


def encode_long_prompt(pipeline, prompt, negative_prompt, device):
    import torch
    tokenizers = [pipeline.tokenizer, pipeline.tokenizer_2]
    positive, negative = tokenize_prompts(tokenizers, prompt, negative_prompt)
    validate_tokens(positive, negative)
    windows = [tokenizer.model_max_length - 2 for tokenizer in tokenizers]
    chunks = max(1, max(math.ceil(len(ids) / size) for sequences in (positive, negative) for ids, size in zip(sequences, windows)))
    # Keep Diffusers behavior exactly for short prompts.
    if chunks == 1:
        return pipeline.encode_prompt(prompt=prompt, negative_prompt=negative_prompt,
                                      device=device, do_classifier_free_guidance=True)
    conditioning = []
    pooled = None
    for index, (tokenizer, encoder) in enumerate(zip(tokenizers, [pipeline.text_encoder, pipeline.text_encoder_2])):
        window = tokenizer.model_max_length
        size = window - 2
        rows, weights = [], []
        for ids in (positive[index], negative[index]):
            lengths = []
            for chunk in range(chunks):
                content = ids[chunk * size:(chunk + 1) * size]
                row = [tokenizer.bos_token_id] + content + [tokenizer.eos_token_id]
                rows.append(row + [tokenizer.pad_token_id] * (window - len(row)))
                lengths.append(len(content))
            weights.append(lengths if sum(lengths) else [1] + [0] * (chunks - 1))
        output = encoder(torch.tensor(rows, dtype=torch.long, device=device), output_hidden_states=True)
        hidden = output.hidden_states[-2]
        conditioning.append(torch.stack([torch.cat(list(part), dim=0) for part in hidden.split(chunks)]))
        if index == 1:
            # SDXL needs one projected global embedding. Include all nonempty
            # blocks in a token-weighted mean; empty padding blocks add no weight.
            projected = output.text_embeds.reshape(2, chunks, -1)
            weight = torch.tensor(weights, device=device, dtype=torch.float32).unsqueeze(-1)
            pooled = ((projected.float() * weight).sum(1) / weight.sum(1)).to(projected.dtype)
    embeddings = torch.cat(conditioning, dim=-1).to(dtype=pipeline.text_encoder_2.dtype, device=device)
    return embeddings[0:1], embeddings[1:2], pooled[0:1], pooled[1:2]
