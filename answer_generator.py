from transformers import T5ForConditionalGeneration, T5Tokenizer

# Load FLAN-T5 (instruction-tuned T5 by Google)
model_name = "google/flan-t5-base"
tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
model = T5ForConditionalGeneration.from_pretrained(model_name)

def generate_answer(question, context_chunks):
    """
    Cleaned neural generation. Optimized for small model performance.
    """
    context = " ".join(context_chunks)
    
    # Simpler, more direct prompt for FLAN-T5-base
    prompt = f"Answer the question based on the context provided.\n\nContext: {context[:2000]}\n\nQuestion: {question}\n\nAnswer:"
    
    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
    
    # Generate answer
    outputs = model.generate(
        inputs.input_ids,
        max_new_tokens=200,
        num_beams=4,
        early_stopping=True,
        no_repeat_ngram_size=2,
        repetition_penalty=1.1
    )
    
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Basic cleanup in case it echoes something
    if "Answer:" in answer:
        answer = answer.split("Answer:")[-1].strip()
        
    return answer if answer else "No specific information found in the document."

