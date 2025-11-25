BEGIN TRANSACTION;

CREATE TABLE program_knowledge_blocks_new (
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE ON UPDATE CASCADE,
  knowledge_block_id INTEGER NOT NULL REFERENCES knowledge_blocks(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (program_id, knowledge_block_id)
);

INSERT INTO program_knowledge_blocks_new (program_id, knowledge_block_id, created_at, updated_at)
SELECT program_id, knowledge_block_id, created_at, updated_at
FROM program_knowledge_blocks;

DROP TABLE program_knowledge_blocks;
ALTER TABLE program_knowledge_blocks_new RENAME TO program_knowledge_blocks;

COMMIT;

