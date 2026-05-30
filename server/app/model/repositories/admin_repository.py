class AdminRepository:

    def __init__(self, conn):
        self.conn = conn

    def buscar_por_usuario(self, usuario):
        cursor = self.conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT *
            FROM tbAdmin
            WHERE usuario = %s
        """, (usuario,))

        return cursor.fetchone()