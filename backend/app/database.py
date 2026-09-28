import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

# Carrega as variáveis do .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase_client() -> Client:
    """
    Inicializa e retorna o cliente do Supabase.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Faltam as credenciais do Supabase no .env!")
        raise ValueError("SUPABASE_URL e SUPABASE_KEY são obrigatórios.")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Instância global para ser importada em outros arquivos
supabase: Client = get_supabase_client()
