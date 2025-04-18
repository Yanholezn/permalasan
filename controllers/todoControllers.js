const db = require('../db');

exports.getAllProjects = (req, res) => {
    const userId = req.user.id;
    
    const sql = "SELECT * FROM project WHERE user_id = ? ORDER BY created_at DESC";
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch projects" });
        }
        
        res.json({ data: results });
    });
};

exports.createProject = (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Project name is required" });
    }
    
    const sql = "INSERT INTO project (name, user_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())";
    db.query(sql, [name, userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to create project" });
        }
        
        res.status(201).json({
            id: result.insertId,
            name,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    });
};

exports.getProject = (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const sql = "SELECT * FROM project WHERE id = ? AND user_id = ?";
    
    db.query(sql, [projectId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "You don't have permission to view this project" });
        }
        res.json({ data: results[0] });
    });
};

exports.updateProject = (req, res) => {
    const projectId = req.params.id;
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Project name is required" });
    }
    const checkSql = "SELECT * FROM project WHERE id = ? AND user_id = ?";
    
    db.query(checkSql, [projectId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "You don't have permission to update this project" });
        }
        const updateSql = "UPDATE project SET name = ?, updated_at = NOW() WHERE id = ?";
        
        db.query(updateSql, [name, projectId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to update project" });
            }
            
            res.json({ success: true, message: "Project updated successfully" });
        });
    });
};

exports.deleteProject = (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const checkSql = "SELECT * FROM project WHERE id = ? AND user_id = ?";
    
    db.query(checkSql, [projectId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "You don't have permission to delete this project" });
        }
        const deleteSql = "DELETE FROM project WHERE id = ?";
        
        db.query(deleteSql, [projectId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to delete project" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Project not found" });
            }
            
            res.json({ success: true, message: "Project deleted successfully" });
        });
    });
};

// LIST CONTROLLER
// ===========================================
exports.getListsByProject = (req, res) => {
    const projectId = req.params.project_id;
    const userId = req.user.id;
    
    // Verify project belongs to user
    const checkSql = "SELECT * FROM project WHERE id = ? AND user_id = ?";
    
    db.query(checkSql, [projectId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "Project not found or you don't have permission to access it" });
        }
        
        // Fetch lists
        db.query("SELECT * FROM list WHERE project_id = ? ORDER BY created_at ASC", [projectId], (err, results) => {
            if (err) {
                console.error("Query error:", err);
                return res.status(500).json({ error: "Database error: " + err.message });
            }

            res.json({ success: true, data: results });
        });
    });
};

exports.createList = (req, res) => {
    const { project_id, name } = req.body;
    const userId = req.user.id;
    
    if (!project_id || !name) return res.status(400).json({ error: "Project ID and name are required" });

    // Verify project belongs to user
    db.query("SELECT * FROM project WHERE id = ? AND user_id = ?", [project_id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error: " + err.message });
        
        if (results.length === 0) {
            return res.status(403).json({ error: "You don't have permission to access this project" });
        }
        
        db.query(
            "INSERT INTO list (project_id, name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", 
            [project_id, name], 
            (err, result) => {
                if (err) return res.status(500).json({ error: "Database error: " + err.message });

                res.json({ 
                    success: true, 
                    message: "List created successfully", 
                    data: {
                        id: result.insertId,
                        name,
                        project_id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                });
            }
        );
    });
};

exports.getList = (req, res) => {
    const listId = req.params.id;
    const userId = req.user.id;
    
    const sql = `
        SELECT l.* FROM list l
        JOIN project p ON l.project_id = p.id
        WHERE l.id = ? AND p.user_id = ?
    `;
    
    db.query(sql, [listId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "List not found or you don't have permission to view it" });
        }
        
        res.json({ data: results[0] });
    });
};

exports.updateList = (req, res) => {
    const listId = req.params.id;
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "List name is required" });
    }
    
    // Verify list belongs to user's project
    const checkSql = `
        SELECT l.* FROM list l
        JOIN project p ON l.project_id = p.id
        WHERE l.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [listId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "List not found or you don't have permission to update it" });
        }
        
        const updateSql = "UPDATE list SET name = ?, updated_at = NOW() WHERE id = ?";
        
        db.query(updateSql, [name, listId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to update list" });
            }
            
            res.json({ success: true, message: "List updated successfully" });
        });
    });
};

exports.deleteList = (req, res) => {
    const listId = req.params.id;
    const userId = req.user.id;
    
    // Verify list belongs to user's project
    const checkSql = `
        SELECT l.* FROM list l
        JOIN project p ON l.project_id = p.id
        WHERE l.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [listId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "List not found or you don't have permission to delete it" });
        }
        
        db.query("DELETE FROM list WHERE id = ?", [listId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to delete list" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "List not found" });
            }
            
            res.json({ success: true, message: "List deleted successfully" });
        });
    });
};

// CARD CONTROLLER
// ===========================================
exports.getCardsByList = (req, res) => {
    const listId = req.params.list_id;
    const userId = req.user.id;

    // Verify list belongs to user's project first
    const checkSql = `
        SELECT l.* FROM list l
        JOIN project p ON l.project_id = p.id
        WHERE l.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [listId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "List not found or you don't have permission to access it" });
        }
        
        // Now fetch cards
        db.query("SELECT * FROM card WHERE list_id = ? ORDER BY created_at ASC", [listId], (err, results) => {
            if (err) {
                console.error("Query error:", err);
                return res.status(500).json({ error: "Database error: " + err.message });
            }

            res.json({ success: true, data: results });
        });
    });
};

exports.createCard = (req, res) => {
    const { list_id, title } = req.body;
    const userId = req.user.id;
    
    if (!list_id || !title) return res.status(400).json({ error: "List ID and title are required" });

    // Verify list belongs to user's project
    const checkSql = `
        SELECT l.* FROM list l
        JOIN project p ON l.project_id = p.id
        WHERE l.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [list_id, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "List not found or you don't have permission to access it" });
        }
        
        db.query(
            "INSERT INTO card (list_id, title, is_complete, created_at, updated_at) VALUES (?, ?, false, NOW(), NOW())",
            [list_id, title],
            (err, result) => {
                if (err) return res.status(500).json({ error: "Database error: " + err.message });

                res.json({ 
                    success: true, 
                    message: "Card created successfully", 
                    data: {
                        id: result.insertId,
                        title,
                        list_id,
                        is_complete: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                });
            }
        );
    });
};

exports.getCard = (req, res) => {
    const cardId = req.params.id;
    const userId = req.user.id;
    
    const sql = `
        SELECT c.* FROM card c
        JOIN list l ON c.list_id = l.id
        JOIN project p ON l.project_id = p.id
        WHERE c.id = ? AND p.user_id = ?
    `;
    
    db.query(sql, [cardId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "Card not found or you don't have permission to view it" });
        }
        
        res.json({ data: results[0] });
    });
};

exports.updateCard = (req, res) => {
    const cardId = req.params.id;
    const { title, is_complete, list_id } = req.body;
    const userId = req.user.id;

    // Verify card belongs to user's project
    const checkSql = `
        SELECT c.* FROM card c
        JOIN list l ON c.list_id = l.id
        JOIN project p ON l.project_id = p.id
        WHERE c.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [cardId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "Card not found or you don't have permission to update it" });
        }
        
        let sqlParts = [];
        let params = [];

        if (title !== undefined) {
            sqlParts.push("title = ?");
            params.push(title);
        }

        if (is_complete !== undefined) {
            sqlParts.push("is_complete = ?");
            params.push(is_complete);
        }

        if (list_id !== undefined) {
            // Verify new list belongs to user's project if changing lists
            const checkListSql = `
                SELECT l.* FROM list l
                JOIN project p ON l.project_id = p.id
                WHERE l.id = ? AND p.user_id = ?
            `;
            
            db.query(checkListSql, [list_id, userId], (err, listResults) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Database error" });
                }
                
                if (listResults.length === 0) {
                    return res.status(403).json({ error: "Target list not found or you don't have permission to access it" });
                }
                
                sqlParts.push("list_id = ?");
                params.push(list_id);
                
                completeUpdate();
            });
        } else {
            completeUpdate();
        }

        function completeUpdate() {
            if (sqlParts.length === 0) {
                return res.status(400).json({ error: "No fields to update" });
            }
            
            sqlParts.push("updated_at = NOW()");
            params.push(cardId);

            const sql = `UPDATE card SET ${sqlParts.join(", ")} WHERE id = ?`;

            db.query(sql, params, (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Database error: " + err.message });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Card not found" });
                }

                res.json({ success: true, message: "Card updated successfully" });
            });
        }
    });
};

exports.toggleCardComplete = (req, res) => {
    const cardId = req.params.id;
    const userId = req.user.id;
    
    // First check if card belongs to user's project
    const checkSql = `
        SELECT c.* FROM card c
        JOIN list l ON c.list_id = l.id
        JOIN project p ON l.project_id = p.id
        WHERE c.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [cardId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "Card not found or you don't have permission to update it" });
        }
        
        const card = results[0];
        const newStatus = !card.is_complete;
        
        const updateSql = "UPDATE card SET is_complete = ?, updated_at = NOW() WHERE id = ?";
        
        db.query(updateSql, [newStatus, cardId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to update card status" });
            }
            
            res.json({ 
                success: true, 
                message: `Card marked as ${newStatus ? 'complete' : 'incomplete'}`,
                data: {
                    is_complete: newStatus
                }
            });
        });
    });
};

exports.deleteCard = (req, res) => {
    const cardId = req.params.id;
    const userId = req.user.id;
    
    // First check if card belongs to user's project
    const checkSql = `
        SELECT c.* FROM card c
        JOIN list l ON c.list_id = l.id
        JOIN project p ON l.project_id = p.id
        WHERE c.id = ? AND p.user_id = ?
    `;
    
    db.query(checkSql, [cardId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(403).json({ error: "Card not found or you don't have permission to delete it" });
        }
        
        db.query("DELETE FROM card WHERE id = ?", [cardId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to delete card" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Card not found" });
            }
            
            res.json({ success: true, message: "Card deleted successfully" });
        });
    });
};