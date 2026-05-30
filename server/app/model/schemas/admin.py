from pydantic import BaseModel

class LoginRequest(BaseModel):
    usuario: str
    senha: str