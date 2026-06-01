from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.db.connection import get_pool  # Importado o gerenciador de banco de dados
from app.model.schemas.discipline import ExtractionResponse
from app.services.extraction_service import extract_disciplines_from_pdf

router = APIRouter(prefix="/api", tags=["historico"])


@router.post("/extrair-historico", response_model=ExtractionResponse)
async def extrair_historico(file: UploadFile = File(...)) -> ExtractionResponse:
    """Extrai disciplinas do PDF enviado pelo cliente e valida os nomes no Banco de Dados."""
    
    # 1. Validação do arquivo
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Envie um arquivo PDF valido.")

    # 2. Extração crua do PDF
    pdf_bytes = await file.read()
    disciplinas = extract_disciplines_from_pdf(pdf_bytes)

    if not disciplinas:
        raise HTTPException(
            status_code=422,
            detail=(
                "Nao foi possivel extrair disciplinas do PDF. "
                "Confirme se o historico segue o modelo padrao da universidade."
            ),
        )

    # 3. Integração com o Banco de Dados (Enriquecimento dos dados)
    pool = await get_pool()
    
    async with pool.acquire() as connection:
        for materia in disciplinas:
            # Captura o código extraído (funciona se for um dicionário ou objeto Pydantic)
            codigo = getattr(materia, "codigo_disciplina", None) or materia.get("codigo_disciplina")
            
            if codigo:
                # Busca o nome oficial mapeado no banco de dados usando o índice do código
                nome_oficial = await connection.fetchval(
                    "SELECT nome FROM disciplinas WHERE codigo = $1", 
                    str(codigo).strip().upper()
                )
                
                # Se encontrou no banco, substitui o nome sujo do PDF pelo oficial do banco
                if nome_oficial:
                    if hasattr(materia, "nome_disciplina"):
                        materia.nome_disciplina = nome_oficial
                    else:
                        materia["nome_disciplina"] = nome_oficial

    # 4. Retorna a resposta limpa e consistente para o Front-end
    return ExtractionResponse(
        total_disciplinas=len(disciplinas),
        disciplinas=disciplinas,
    )