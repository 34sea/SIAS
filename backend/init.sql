-- ============================================================
-- SISTEMA INTELIGENTE DE ANÁLISE DE SIMILARIDADE
-- Banco de dados: SIAS
-- ============================================================

-- DROP DATABASE IF EXISTS SIAS;

CREATE DATABASE IF NOT EXISTS SIAS
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE SIAS;


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


INSERT INTO roles (nome, descricao) VALUES
('ADMIN', 'Administrador do sistema'),
('ESTUDANTE', 'Estudante que submete monografias'),
('DOCENTE', 'Docente ou orientador');


-- ============================================================
-- 2. PERMISSÕES
-- ============================================================

CREATE TABLE permissoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE permissoes MODIFY codigo VARCHAR(100) NULL;
INSERT INTO permissoes (codigo, nome, descricao) VALUES
('UTILIZADORES_VISUALIZAR', 'Visualizar utilizadores', 'Visualizar utilizadores'),
('UTILIZADORES_CRIAR', 'Criar utilizadores', 'Criar utilizadores'),
('UTILIZADORES_EDITAR', 'Editar utilizadores', 'Editar utilizadores'),
('UTILIZADORES_DESATIVAR', 'Ativar ou desativar utilizadores', 'Ativar ou desativar utilizadores'),

('MONOGRAFIAS_VISUALIZAR', 'Visualizar monografias', 'Visualizar monografias'),
('MONOGRAFIAS_SUBMETER', 'Submeter monografias', 'Submeter monografias'),
('MONOGRAFIAS_EDITAR', 'Editar monografias', 'Editar monografias'),
('MONOGRAFIAS_ELIMINAR', 'Eliminar monografias', 'Eliminar monografias'),

('ANALISES_VISUALIZAR', 'Visualizar análises', 'Visualizar análises'),
('ANALISES_EXECUTAR', 'Executar análises', 'Executar análises'),
('ANALISES_REANALISAR', 'Solicitar nova análise', 'Solicitar nova análise'),

('RELATORIOS_VISUALIZAR', 'Visualizar relatórios', 'Visualizar relatórios'),
('RELATORIOS_EXPORTAR', 'Exportar relatórios', 'Exportar relatórios'),

('DOCUMENTOS_GERIR', 'Gerir documentos da base documental', 'Gerir documentos da base documental'),

('CURSOS_GERIR', 'Gerir cursos', 'Gerir cursos'),
('ORIENTADORES_GERIR', 'Gerir orientadores', 'Gerir orientadores'),

('CONFIGURACOES_GERIR', 'Gerir configurações de similaridade', 'Gerir configurações de similaridade'),

('AUDITORIA_VISUALIZAR', 'Visualizar auditoria', 'Visualizar auditoria');


-- ============================================================
-- 3. ROLE_PERMISSOES
-- ============================================================

CREATE TABLE role_permissoes (
    role_id INT UNSIGNED NOT NULL,
    permissao_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (role_id, permissao_id),

    CONSTRAINT fk_role_permissoes_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissoes_permissao
        FOREIGN KEY (permissao_id)
        REFERENCES permissoes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ADMIN recebe todas as permissões
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissoes p
WHERE r.nome = 'ADMIN';


-- ============================================================
-- 4. CURSOS
-- ============================================================

CREATE TABLE cursos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) UNIQUE,

    descricao TEXT,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_cursos_nome (nome),
    INDEX idx_cursos_ativo (ativo)
) ENGINE=InnoDB;


-- Dados iniciais
INSERT INTO cursos (nome, codigo) VALUES
('Engenharia Informática', 'ENG-INF'),
('Engenharia Civil', 'ENG-CIV'),
('Engenharia Electrónica', 'ENG-ELE'),
('Administração Pública', 'ADM-PUB');


-- ============================================================
-- 5. UTILIZADORES
-- ============================================================

CREATE TABLE utilizadores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nome_completo VARCHAR(150) NOT NULL,

    username VARCHAR(80) UNIQUE,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role_id INT UNSIGNED NOT NULL,

    numero_identificacao VARCHAR(80),

    telefone VARCHAR(30),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    ultimo_login DATETIME NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_utilizadores_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    INDEX idx_utilizadores_nome (nome_completo),
    INDEX idx_utilizadores_email (email),
    INDEX idx_utilizadores_role (role_id),
    INDEX idx_utilizadores_ativo (ativo)
) ENGINE=InnoDB;

ALTER TABLE utilizadores ADD COLUMN foto VARCHAR(255) NOT NULL DEFAULT '' AFTER ativo;


-- ============================================================
-- 6. DOCENTES
-- ============================================================

CREATE TABLE docentes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT UNSIGNED NOT NULL UNIQUE,

    departamento VARCHAR(150),

    especialidade VARCHAR(150),

    grau_academico VARCHAR(100),

    numero_funcionario VARCHAR(80),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_docentes_utilizador
        FOREIGN KEY (utilizador_id)
        REFERENCES utilizadores(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 7. ESTUDANTES
-- ============================================================

CREATE TABLE estudantes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT UNSIGNED NOT NULL UNIQUE,

    curso_id INT UNSIGNED NOT NULL,

    numero_estudante VARCHAR(80) UNIQUE,

    ano_ingresso YEAR NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_estudantes_utilizador
        FOREIGN KEY (utilizador_id)
        REFERENCES utilizadores(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_estudantes_curso
        FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE RESTRICT,

    INDEX idx_estudantes_curso (curso_id)
) ENGINE=InnoDB;


-- ============================================================
-- 8. MONOGRAFIAS
-- ============================================================

CREATE TABLE monografias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    estudante_id INT UNSIGNED NOT NULL,

    orientador_id INT UNSIGNED NULL,

    titulo VARCHAR(500) NOT NULL,

    ano YEAR NOT NULL,

    descricao TEXT,

    estado ENUM(
        'SUBMETIDA',
        'AGUARDANDO_ANALISE',
        'EM_ANALISE',
        'ANALISADA',
        'RELATORIO_DISPONIVEL',
        'ERRO_PROCESSAMENTO',
        'ARQUIVADA'
    ) NOT NULL DEFAULT 'SUBMETIDA',

    versao_atual INT UNSIGNED NOT NULL DEFAULT 1,

    participa_comparacao BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_monografias_estudante
        FOREIGN KEY (estudante_id)
        REFERENCES estudantes(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_monografias_orientador
        FOREIGN KEY (orientador_id)
        REFERENCES docentes(id)
        ON DELETE SET NULL,

    INDEX idx_monografias_estudante (estudante_id),
    INDEX idx_monografias_orientador (orientador_id),
    INDEX idx_monografias_estado (estado),
    INDEX idx_monografias_ano (ano),
    INDEX idx_monografias_titulo (titulo)
) ENGINE=InnoDB;


-- ============================================================
-- 9. VERSÕES DAS MONOGRAFIAS
-- ============================================================

CREATE TABLE monografia_versoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    monografia_id BIGINT UNSIGNED NOT NULL,

    numero_versao INT UNSIGNED NOT NULL,

    nome_ficheiro VARCHAR(255) NOT NULL,

    nome_original VARCHAR(255),

    caminho_ficheiro VARCHAR(500) NOT NULL,

    extensao VARCHAR(20) NOT NULL,

    mime_type VARCHAR(100),

    tamanho_bytes BIGINT UNSIGNED,

    hash_sha256 CHAR(64),

    texto_extraido LONGTEXT,

    texto_processado LONGTEXT,

    estado ENUM(
        'SUBMETIDA',
        'TEXTO_EXTRAIDO',
        'PROCESSADA',
        'ERRO'
    ) NOT NULL DEFAULT 'SUBMETIDA',

    submetido_por INT UNSIGNED NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_monografia_versao (
        monografia_id,
        numero_versao
    ),

    CONSTRAINT fk_versoes_monografia
        FOREIGN KEY (monografia_id)
        REFERENCES monografias(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_versoes_utilizador
        FOREIGN KEY (submetido_por)
        REFERENCES utilizadores(id)
        ON DELETE RESTRICT,

    INDEX idx_versoes_hash (hash_sha256),
    INDEX idx_versoes_estado (estado)
) ENGINE=InnoDB;


-- ============================================================
-- 10. ANÁLISES
-- ============================================================

CREATE TABLE analises (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    monografia_versao_id BIGINT UNSIGNED NOT NULL,

    iniciado_por INT UNSIGNED NULL,

    algoritmo VARCHAR(150) NOT NULL,

    versao_algoritmo VARCHAR(50),

    estado ENUM(
        'AGUARDANDO',
        'PROCESSANDO',
        'CONCLUIDA',
        'ERRO'
    ) NOT NULL DEFAULT 'AGUARDANDO',

    similaridade_geral DECIMAL(5,2) NULL,

    classificacao VARCHAR(50),

    data_inicio DATETIME NULL,

    data_conclusao DATETIME NULL,

    erro_mensagem TEXT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_analises_versao
        FOREIGN KEY (monografia_versao_id)
        REFERENCES monografia_versoes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_analises_utilizador
        FOREIGN KEY (iniciado_por)
        REFERENCES utilizadores(id)
        ON DELETE SET NULL,

    INDEX idx_analises_estado (estado),
    INDEX idx_analises_similaridade (similaridade_geral),
    INDEX idx_analises_data (data_conclusao)
) ENGINE=InnoDB;


-- ============================================================
-- 11. DOCUMENTOS DA BASE DE COMPARAÇÃO
-- ============================================================

CREATE TABLE documentos_comparacao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    monografia_versao_id BIGINT UNSIGNED NULL,

    titulo VARCHAR(500) NOT NULL,

    autor VARCHAR(255),

    ano YEAR,

    curso_id INT UNSIGNED NULL,

    nome_ficheiro VARCHAR(255),

    caminho_ficheiro VARCHAR(500),

    hash_sha256 CHAR(64),

    texto_extraido LONGTEXT,

    texto_processado LONGTEXT,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    excluir_da_comparacao BOOLEAN NOT NULL DEFAULT FALSE,

    motivo_exclusao VARCHAR(255),

    criado_por INT UNSIGNED NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_documentos_versao
        FOREIGN KEY (monografia_versao_id)
        REFERENCES monografia_versoes(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_documentos_curso
        FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_documentos_criador
        FOREIGN KEY (criado_por)
        REFERENCES utilizadores(id)
        ON DELETE SET NULL,

    INDEX idx_documentos_titulo (titulo),
    INDEX idx_documentos_hash (hash_sha256),
    INDEX idx_documentos_ativo (ativo),
    INDEX idx_documentos_comparacao (excluir_da_comparacao)
) ENGINE=InnoDB;


-- ============================================================
-- 12. RESULTADOS DE COMPARAÇÃO
-- ============================================================

CREATE TABLE resultados_comparacao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    analise_id BIGINT UNSIGNED NOT NULL,

    documento_id BIGINT UNSIGNED NOT NULL,

    percentual_similaridade DECIMAL(5,2) NOT NULL,

    percentual_textual DECIMAL(5,2),

    percentual_semantico DECIMAL(5,2),

    quantidade_trechos INT UNSIGNED DEFAULT 0,

    posicao_ranking INT UNSIGNED,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resultados_analise
        FOREIGN KEY (analise_id)
        REFERENCES analises(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_resultados_documento
        FOREIGN KEY (documento_id)
        REFERENCES documentos_comparacao(id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_analise_documento (
        analise_id,
        documento_id
    ),

    INDEX idx_resultados_similaridade (
        percentual_similaridade
    ),

    INDEX idx_resultados_ranking (
        analise_id,
        posicao_ranking
    )
) ENGINE=InnoDB;


-- ============================================================
-- 13. TRECHOS SEMELHANTES
-- ============================================================

CREATE TABLE trechos_semelhantes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    resultado_comparacao_id BIGINT UNSIGNED NOT NULL,

    texto_documento_origem TEXT NOT NULL,

    texto_documento_comparado TEXT NOT NULL,

    pagina_origem INT UNSIGNED NULL,

    pagina_comparada INT UNSIGNED NULL,

    posicao_inicio_origem INT UNSIGNED NULL,

    posicao_fim_origem INT UNSIGNED NULL,

    percentual_similaridade DECIMAL(5,2),

    metodo VARCHAR(100),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trechos_resultado
        FOREIGN KEY (resultado_comparacao_id)
        REFERENCES resultados_comparacao(id)
        ON DELETE CASCADE,

    INDEX idx_trechos_resultado (
        resultado_comparacao_id
    ),

    INDEX idx_trechos_similaridade (
        percentual_similaridade
    )
) ENGINE=InnoDB;


-- ============================================================
-- 14. RELATÓRIOS
-- ============================================================

CREATE TABLE relatorios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    analise_id BIGINT UNSIGNED NOT NULL UNIQUE,

    numero_relatorio VARCHAR(100) UNIQUE,

    caminho_ficheiro VARCHAR(500),

    formato VARCHAR(20) DEFAULT 'PDF',

    percentual_similaridade DECIMAL(5,2),

    classificacao VARCHAR(50),

    disponivel_estudante BOOLEAN NOT NULL DEFAULT FALSE,

    disponivel_orientador BOOLEAN NOT NULL DEFAULT TRUE,

    gerado_por INT UNSIGNED NULL,

    data_geracao DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_relatorios_analise
        FOREIGN KEY (analise_id)
        REFERENCES analises(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_relatorios_utilizador
        FOREIGN KEY (gerado_por)
        REFERENCES utilizadores(id)
        ON DELETE SET NULL,

    INDEX idx_relatorios_disponibilidade (
        disponivel_estudante,
        disponivel_orientador
    )
) ENGINE=InnoDB;


-- ============================================================
-- 15. CONFIGURAÇÕES DE SIMILARIDADE
-- ============================================================

CREATE TABLE configuracoes_similaridade (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,

    algoritmo VARCHAR(150) NOT NULL,

    peso_textual DECIMAL(5,2) DEFAULT 50.00,

    peso_semantico DECIMAL(5,2) DEFAULT 50.00,

    similaridade_minima DECIMAL(5,2) DEFAULT 10.00,

    limite_documentos INT UNSIGNED DEFAULT 10,

    ignorar_bibliografia BOOLEAN DEFAULT TRUE,

    ignorar_capa BOOLEAN DEFAULT TRUE,

    ignorar_indice BOOLEAN DEFAULT TRUE,

    ignorar_anexos BOOLEAN DEFAULT TRUE,

    ignorar_citacoes BOOLEAN DEFAULT TRUE,

    ignorar_palavras_comuns BOOLEAN DEFAULT TRUE,

    ativa BOOLEAN DEFAULT FALSE,

    criado_por INT UNSIGNED NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_config_criador
        FOREIGN KEY (criado_por)
        REFERENCES utilizadores(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- Configuração inicial
INSERT INTO configuracoes_similaridade (
    nome,
    algoritmo,
    peso_textual,
    peso_semantico,
    similaridade_minima,
    limite_documentos,
    ignorar_bibliografia,
    ignorar_capa,
    ignorar_indice,
    ignorar_anexos,
    ignorar_citacoes,
    ignorar_palavras_comuns,
    ativa
) VALUES (
    'Configuração padrão',
    'TF-IDF + Similaridade de Cosseno',
    100.00,
    0.00,
    10.00,
    10,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
);


-- ============================================================
-- 16. LIMITES / CLASSIFICAÇÕES DE SIMILARIDADE
-- ============================================================

CREATE TABLE classificacoes_similaridade (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(50) NOT NULL,

    percentual_minimo DECIMAL(5,2) NOT NULL,

    percentual_maximo DECIMAL(5,2) NOT NULL,

    descricao VARCHAR(255),

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


INSERT INTO classificacoes_similaridade (
    nome,
    percentual_minimo,
    percentual_maximo,
    descricao
) VALUES
('Baixa', 0.00, 15.00, 'Baixo nível de similaridade'),
('Moderada', 15.01, 30.00, 'Nível moderado de similaridade'),
('Elevada', 30.01, 50.00, 'Elevado nível de similaridade'),
('Muito elevada', 50.01, 100.00, 'Nível muito elevado de similaridade');


-- ============================================================
-- 17. NOTIFICAÇÕES
-- ============================================================

CREATE TABLE notificacoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT UNSIGNED NOT NULL,

    tipo VARCHAR(50) NOT NULL,

    titulo VARCHAR(200) NOT NULL,

    mensagem TEXT NOT NULL,

    referencia_tipo VARCHAR(50),

    referencia_id BIGINT UNSIGNED,

    lida BOOLEAN NOT NULL DEFAULT FALSE,

    data_leitura DATETIME NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacoes_utilizador
        FOREIGN KEY (utilizador_id)
        REFERENCES utilizadores(id)
        ON DELETE CASCADE,

    INDEX idx_notificacoes_utilizador (
        utilizador_id
    ),

    INDEX idx_notificacoes_lida (
        utilizador_id,
        lida
    )
) ENGINE=InnoDB;


-- ============================================================
-- 18. AUDITORIA
-- ============================================================

CREATE TABLE auditoria (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT UNSIGNED NULL,

    acao VARCHAR(100) NOT NULL,

    entidade VARCHAR(100),

    entidade_id BIGINT UNSIGNED,

    descricao TEXT,

    ip_address VARCHAR(45),

    user_agent VARCHAR(500),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoria_utilizador
        FOREIGN KEY (utilizador_id)
        REFERENCES utilizadores(id)
        ON DELETE SET NULL,

    INDEX idx_auditoria_utilizador (
        utilizador_id
    ),

    INDEX idx_auditoria_acao (
        acao
    ),

    INDEX idx_auditoria_entidade (
        entidade,
        entidade_id
    ),

    INDEX idx_auditoria_data (
        criado_em
    )
) ENGINE=InnoDB;


-- ============================================================
-- 19. SESSÕES / TOKENS
-- ============================================================

CREATE TABLE sessoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT UNSIGNED NOT NULL,

    token_hash VARCHAR(255) NOT NULL,

    ip_address VARCHAR(45),

    user_agent VARCHAR(500),

    expira_em DATETIME NOT NULL,

    revogada BOOLEAN DEFAULT FALSE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sessoes_utilizador
        FOREIGN KEY (utilizador_id)
        REFERENCES utilizadores(id)
        ON DELETE CASCADE,

    INDEX idx_sessoes_token (
        token_hash
    ),

    INDEX idx_sessoes_utilizador (
        utilizador_id
    ),

    INDEX idx_sessoes_expiracao (
        expira_em
    )
) ENGINE=InnoDB;


-- ============================================================
-- 20. ORIENTAÇÕES
-- ============================================================

CREATE TABLE orientacoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    estudante_id INT UNSIGNED NOT NULL,

    docente_id INT UNSIGNED NOT NULL,

    data_inicio DATE,

    data_fim DATE NULL,

    estado ENUM(
        'ATIVA',
        'CONCLUIDA',
        'CANCELADA'
    ) DEFAULT 'ATIVA',

    observacoes TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orientacoes_estudante
        FOREIGN KEY (estudante_id)
        REFERENCES estudantes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_orientacoes_docente
        FOREIGN KEY (docente_id)
        REFERENCES docentes(id)
        ON DELETE CASCADE,

    INDEX idx_orientacoes_estudante (
        estudante_id
    ),

    INDEX idx_orientacoes_docente (
        docente_id
    ),

    INDEX idx_orientacoes_estado (
        estado
    )
) ENGINE=InnoDB;


-- ============================================================
-- 21. ÍNDICES ADICIONAIS
-- ============================================================

CREATE INDEX idx_monografias_estudante_estado
ON monografias (estudante_id, estado);

CREATE INDEX idx_analises_versao_estado
ON analises (monografia_versao_id, estado);

CREATE INDEX idx_resultados_analise_percentual
ON resultados_comparacao (
    analise_id,
    percentual_similaridade
);


-- ============================================================
-- FIM
-- ============================================================