import bcrypt

class AuthService:

    @staticmethod
    def verificar_senha(senha, senha_hash):
        return bcrypt.checkpw(
            senha.encode(),
            senha_hash.encode()
        )