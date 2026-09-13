FROM python:3.12-slim

WORKDIR /app

# Copia as dependências
COPY requirements.txt .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código Python
COPY . .

EXPOSE 8000

# CMD ["python", "main.py"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]