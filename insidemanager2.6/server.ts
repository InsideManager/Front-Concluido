import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa o banco de dados SQLite
const db = new Database("database.db");
db.pragma('foreign_keys = ON'); // Habilita suporte a chaves estrangeiras
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Criação das tabelas do banco de dados caso não existam
db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    owner_id INTEGER,
    primary_color TEXT DEFAULT '#ea580c',
    logo_url TEXT,
    banner_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS organization_members (
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',
    PRIMARY KEY (user_id, organization_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    organization_id INTEGER,
    avatar_url TEXT,
    google_calendar_connected INTEGER DEFAULT 0,
    google_calendar_id TEXT,
    email_notifications INTEGER DEFAULT 1,
    sms_notifications INTEGER DEFAULT 0,
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    google_meet_url TEXT,
    type TEXT DEFAULT 'physical',
    organization_id INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    organization_id INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    notification_sent INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (room_id) REFERENCES rooms (id)
  );

  CREATE TABLE IF NOT EXISTS reservation_resources (
    reservation_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,
    PRIMARY KEY (reservation_id, resource_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS system_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- NULL para anúncios globais
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    PRIMARY KEY (email, token)
  );
`);

// Migração: remover cargo 'admin' de organizações e migrar para 'moderator'
db.prepare("UPDATE organization_members SET role = 'moderator' WHERE role = 'admin'").run();

// Garante que apenas o usuário especificado e o admin padrão sejam admins globais
db.prepare("UPDATE users SET role = 'admin' WHERE email IN ('luhhen26@gmail.com', 'admin@example.com')").run();
db.prepare("UPDATE users SET role = 'user' WHERE email NOT IN ('luhhen26@gmail.com', 'admin@example.com')").run();

try {
  db.prepare("ALTER TABLE users ADD COLUMN avatar_url TEXT").run();
} catch (e) {}

// Migração para organization_members
try {
  const usersWithOrg = db.prepare("SELECT id, organization_id, org_role FROM users WHERE organization_id IS NOT NULL").all();
  usersWithOrg.forEach((u: any) => {
    try {
      db.prepare("INSERT OR IGNORE INTO organization_members (user_id, organization_id, role) VALUES (?, ?, ?)").run(u.id, u.organization_id, u.org_role || 'member');
    } catch (e) {}
  });
} catch (e) {}

try {
  db.prepare("ALTER TABLE organizations ADD COLUMN primary_color TEXT DEFAULT '#ea580c'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE organizations ADD COLUMN logo_url TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE organizations ADD COLUMN banner_url TEXT").run();
} catch (e) {}

// Migrações para adicionar novas colunas se necessário
try {
  db.prepare("ALTER TABLE organizations ADD COLUMN owner_id INTEGER").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN google_calendar_connected INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN google_calendar_id TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN email_notifications INTEGER DEFAULT 1").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN sms_notifications INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN org_role TEXT DEFAULT 'member'").run();
} catch (e) {}

// Verifica se a coluna de imagem existe nas salas
try {
  db.prepare("SELECT image_url FROM rooms LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE rooms ADD COLUMN image_url TEXT");
}

// Verifica se a coluna de Google Meet existe nas salas
try {
  db.prepare("SELECT google_meet_url FROM rooms LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE rooms ADD COLUMN google_meet_url TEXT");
}

// Verifica se a coluna de notificação existe (para compatibilidade com bancos antigos)
try {
  db.prepare("SELECT notification_sent FROM reservations LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE reservations ADD COLUMN notification_sent INTEGER DEFAULT 0");
}

// Verifica se a coluna de ícone existe nos recursos
try {
  db.prepare("SELECT icon FROM resources LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE resources ADD COLUMN icon TEXT");
}

// Verifica se a coluna de tipo existe nas salas
try {
  db.prepare("SELECT type FROM rooms LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE rooms ADD COLUMN type TEXT DEFAULT 'physical'");
}

// Adiciona organization_id às tabelas existentes
try {
  db.prepare("SELECT organization_id FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id)");
}

try {
  db.prepare("SELECT organization_id FROM rooms LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE rooms ADD COLUMN organization_id INTEGER REFERENCES organizations(id)");
}

try {
  db.prepare("SELECT organization_id FROM resources LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE resources ADD COLUMN organization_id INTEGER REFERENCES organizations(id)");
}

// Popula o banco com dados iniciais (Admin, Salas e Recursos) caso o admin não exista
const adminUser: any = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@example.com");
if (!adminUser) {
  // Cria organização padrão
  const orgResult = db.prepare("INSERT INTO organizations (name, code, description) VALUES (?, ?, ?)").run(
    "Organização Padrão",
    "INSIDE",
    "Organização inicial do sistema InsideManager."
  );
  const orgId = orgResult.lastInsertRowid;

  const hashedPassword = bcrypt.hashSync("admin123", 10);
  const adminResult = db.prepare("INSERT INTO users (name, email, password, role, organization_id) VALUES (?, ?, ?, ?, ?)").run(
    "Administrator",
    "admin@example.com",
    hashedPassword,
    "admin",
    orgId
  );
  const adminId = adminResult.lastInsertRowid;

  // Adiciona admin como dono na tabela de membros
  db.prepare("INSERT INTO organization_members (user_id, organization_id, role) VALUES (?, ?, ?)").run(
    adminId,
    orgId,
    'owner'
  );

  // Salas iniciais
  const rooms = [
    { name: "Sala Alpha", capacity: 10, location: "Andar 1, Ala Norte", description: "Sala equipada para videoconferências e apresentações executivas.", organization_id: orgId },
    { name: "Sala Beta", capacity: 6, location: "Andar 1, Ala Sul", description: "Ideal para reuniões de equipe e brainstormings rápidos.", organization_id: orgId },
    { name: "Auditório", capacity: 50, location: "Térreo", description: "Espaço amplo para treinamentos e eventos corporativos.", organization_id: orgId },
    { name: "Sala de Inovação", capacity: 8, location: "Andar 2", description: "Ambiente criativo com paredes de vidro e mobiliário modular.", organization_id: orgId }
  ];
  const insertRoom = db.prepare("INSERT INTO rooms (name, capacity, location, description, organization_id) VALUES (?, ?, ?, ?, ?)");
  rooms.forEach(r => insertRoom.run(r.name, r.capacity, r.location, r.description, r.organization_id));

  // Recursos iniciais
  const resources = [
    { name: "Projetor 4K", description: "Projetor de alta resolução com entrada HDMI.", icon: "Projector", organization_id: orgId },
    { name: "Smart TV 65\"", description: "TV com suporte a AirPlay e Chromecast.", icon: "Tv", organization_id: orgId },
    { name: "Quadro Branco", description: "Quadro magnético com kit de canetas coloridas.", icon: "PenTool", organization_id: orgId },
    { name: "Kit Videoconferência", description: "Câmera 360 e microfone omnidirecional.", icon: "Monitor", organization_id: orgId }
  ];
  const insertResource = db.prepare("INSERT INTO resources (name, description, icon, organization_id) VALUES (?, ?, ?, ?)");
  resources.forEach(res => insertResource.run(res.name, res.description, res.icon, res.organization_id));
} else {
  // Garante que o admin existente esteja na tabela de membros da sua organização
  if (adminUser.organization_id) {
    const isMember = db.prepare("SELECT * FROM organization_members WHERE user_id = ? AND organization_id = ?").get(adminUser.id, adminUser.organization_id);
    if (!isMember) {
      db.prepare("INSERT INTO organization_members (user_id, organization_id, role) VALUES (?, ?, ?)").run(adminUser.id, adminUser.organization_id, 'owner');
    }
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Gerenciamento de conexões WebSocket para notificações em tempo real
  const clients = new Map<number, WebSocket>();

  // Função para enviar mensagens para todos os clientes conectados
  const broadcast = (message: any) => {
    const payload = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  // Função para criar e enviar notificação persistente
  const sendNotification = (userId: number | null, title: string, message: string, type: string = 'info') => {
    const stmt = db.prepare("INSERT INTO system_notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
    const result = stmt.run(userId, title, message, type);
    const notificationId = result.lastInsertRowid;

    const payload = {
      type: "notification",
      id: notificationId,
      title,
      message,
      notificationType: type,
      created_at: new Date().toISOString()
    };

    if (userId) {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    } else {
      broadcast(payload);
    }
  };

  wss.on("connection", (ws) => {
    let currentUserId: number | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Autentica a conexão WebSocket usando o token JWT
        if (message.type === "auth") {
          const token = message.token;
          jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (!err && user) {
              currentUserId = user.id;
              clients.set(user.id, ws);
              console.log(`Usuário ${user.id} conectado ao WebSocket`);
            }
          });
        }
      } catch (e) {
        console.error("Erro na mensagem WS:", e);
      }
    });

    ws.on("close", () => {
      if (currentUserId) {
        clients.delete(currentUserId);
        console.log(`Usuário ${currentUserId} desconectado do WebSocket`);
      }
    });
  });

  // Loop de Notificações: Verifica reuniões que começam em 15 minutos
  setInterval(() => {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);
    const fifteenMinutesStr = fifteenMinutesFromNow.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:mm

    // Busca reservas que começam em ~15 minutos e ainda não foram notificadas
    const upcoming = db.prepare(`
      SELECT r.*, rm.name as room_name 
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.start_time LIKE ? 
      AND r.notification_sent = 0
    `).all(`${fifteenMinutesStr}%`);

    upcoming.forEach((resv: any) => {
      const client = clients.get(resv.user_id);
      if (client && client.readyState === WebSocket.OPEN) {
        // Envia a notificação via WebSocket
        client.send(JSON.stringify({
          type: "notification",
          title: "Lembrete de Reunião",
          message: `Sua reunião "${resv.title}" na ${resv.room_name} começa em 15 minutos!`,
          reservationId: resv.id
        }));
        
        // Marca como notificada para não repetir
        db.prepare("UPDATE reservations SET notification_sent = 1 WHERE id = ?").run(resv.id);
        console.log(`Notificação enviada para o usuário ${resv.user_id} sobre a reserva ${resv.id}`);
      }
    });
  }, 30000); // Verifica a cada 30 segundos

  // Middleware para autenticação via Token JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return res.sendStatus(403);
      
      // Busca dados atualizados do usuário no banco para evitar tokens obsoletos
      const user: any = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.organization_id, u.avatar_url, o.name as organization_name, om.role as org_role
        FROM users u 
        LEFT JOIN organizations o ON u.organization_id = o.id 
        LEFT JOIN organization_members om ON u.id = om.user_id AND u.organization_id = om.organization_id
        WHERE u.id = ?
      `).get(decoded.id);

      if (!user) return res.sendStatus(403);
      
      // Admin global sempre tem cargo de dono em qualquer organização que acessar
      if (user.role === 'admin') {
        user.org_role = 'owner';
      }
      
      req.user = user;
      next();
    });
  };

  // Middleware para verificar se o usuário é administrador (global ou da organização)
  const isOrgAdmin = (req: any, res: any, next: any) => {
    if (req.user.role === 'admin' || req.user.org_role === 'owner' || req.user.org_role === 'moderator') {
      return next();
    }
    return res.status(403).json({ error: "Acesso negado. Requer privilégios de administrador." });
  };

  // Middleware para verificar se o usuário é administrador global
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    next();
  };

  // Rotas de Autenticação
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ error: "E-mail já cadastrado" });
    }
  });

  // --- Forgot Password Routes ---
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (!user) {
      // Por segurança, não revelamos se o e-mail existe
      return res.json({ success: true, message: "Se o e-mail existir, um link de recuperação será enviado." });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hora

    db.prepare("INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)").run(email, token, expiresAt);

    // Simulação de envio de e-mail
    console.log(`[EMAIL SIMULATION] Para: ${email}`);
    console.log(`[EMAIL SIMULATION] Link de recuperação: ${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${email}`);

    res.json({ success: true, message: "E-mail de recuperação enviado com sucesso!" });
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { email, token, newPassword } = req.body;
    
    const resetRequest: any = db.prepare("SELECT * FROM password_reset_tokens WHERE email = ? AND token = ?").get(email, token);
    
    if (!resetRequest) {
      return res.status(400).json({ error: "Token inválido ou expirado." });
    }

    if (new Date(resetRequest.expires_at) < new Date()) {
      db.prepare("DELETE FROM password_reset_tokens WHERE email = ? AND token = ?").run(email, token);
      return res.status(400).json({ error: "Token expirado." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, email);
    db.prepare("DELETE FROM password_reset_tokens WHERE email = ?").run(email);

    res.json({ success: true, message: "Senha alterada com sucesso!" });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare(`
      SELECT u.*, o.name as organization_name, om.role as org_role
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      LEFT JOIN organization_members om ON u.id = om.user_id AND u.organization_id = om.organization_id
      WHERE u.email = ?
    `).get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Admin global sempre tem cargo de dono em qualquer organização que acessar
    if (user.role === 'admin') {
      user.org_role = 'owner';
    }

    const token = jwt.sign({ 
      id: user.id
    }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        org_role: user.org_role,
        avatar_url: user.avatar_url,
        organization_id: user.organization_id,
        organization_name: user.organization_name
      } 
    });
  });

  // Rotas de Perfil
  app.get("/api/profile", authenticateToken, (req: any, res) => {
    const user: any = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.organization_id, u.avatar_url, o.name as organization_name, om.role as org_role
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      LEFT JOIN organization_members om ON u.id = om.user_id AND u.organization_id = om.organization_id
      WHERE u.id = ?
    `).get(req.user.id);
    res.json(user);
  });

  app.put("/api/profile", authenticateToken, (req: any, res) => {
    const { name, email, password, organization_id, avatar_url, google_calendar_connected, google_calendar_id, email_notifications, sms_notifications } = req.body;
    try {
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?").run(name || req.user.name, email || req.user.email, hashedPassword, req.user.id);
      } else if (name || email) {
        db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name || req.user.name, email || req.user.email, req.user.id);
      }

      if (req.body.hasOwnProperty('avatar_url')) {
        db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatar_url, req.user.id);
      }

      // Se organization_id for passado (mesmo que null), atualiza
      if (req.body.hasOwnProperty('organization_id')) {
        db.prepare("UPDATE users SET organization_id = ? WHERE id = ?").run(organization_id, req.user.id);
        
        if (organization_id) {
          // Se estiver entrando em uma organização, garante que tem um cargo (padrão member se não existir)
          db.prepare("INSERT OR IGNORE INTO organization_members (user_id, organization_id, role) VALUES (?, ?, 'member')").run(req.user.id, organization_id);
        } else {
          // Se estiver saindo (null), remove da tabela de membros
          db.prepare("DELETE FROM organization_members WHERE user_id = ?").run(req.user.id);
        }
      }

      // Atualiza campos do Google Calendar
      if (req.body.hasOwnProperty('google_calendar_connected')) {
        db.prepare("UPDATE users SET google_calendar_connected = ? WHERE id = ?").run(google_calendar_connected, req.user.id);
      }
      if (req.body.hasOwnProperty('google_calendar_id')) {
        db.prepare("UPDATE users SET google_calendar_id = ? WHERE id = ?").run(google_calendar_id, req.user.id);
      }

      // Atualiza preferências de notificação
      if (req.body.hasOwnProperty('email_notifications')) {
        db.prepare("UPDATE users SET email_notifications = ? WHERE id = ?").run(email_notifications, req.user.id);
      }
      if (req.body.hasOwnProperty('sms_notifications')) {
        db.prepare("UPDATE users SET sms_notifications = ? WHERE id = ?").run(sms_notifications, req.user.id);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar perfil" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // Rotas de Organizações
  app.get("/api/organizations", authenticateToken, isAdmin, (req, res) => {
    const orgs = db.prepare("SELECT * FROM organizations").all();
    res.json(orgs);
  });

  app.get("/api/organizations/list", authenticateToken, (req: any, res) => {
    // Admin global vê todas as organizações
    if (req.user.role === 'admin') {
      const orgs = db.prepare("SELECT *, 'owner' as user_role FROM organizations").all();
      return res.json(orgs);
    }

    const orgs = db.prepare(`
      SELECT o.*, om.role as user_role
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = ?
    `).all(req.user.id);
    res.json(orgs);
  });

  app.post("/api/organizations/switch", authenticateToken, (req: any, res) => {
    const { organization_id } = req.body;
    const member = db.prepare("SELECT * FROM organization_members WHERE user_id = ? AND organization_id = ?").get(req.user.id, organization_id);
    
    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Você não pertence a esta organização" });
    }

    db.prepare("UPDATE users SET organization_id = ? WHERE id = ?").run(organization_id, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/organizations/my", authenticateToken, (req: any, res) => {
    if (!req.user.organization_id) return res.json(null);
    const org = db.prepare("SELECT * FROM organizations WHERE id = ?").get(req.user.organization_id);
    res.json(org);
  });

  app.post("/api/organizations", authenticateToken, (req: any, res) => {
    const { name, description, primary_color, logo_url, banner_url } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const transaction = db.transaction(() => {
        const result = db.prepare("INSERT INTO organizations (name, code, description, owner_id, primary_color, logo_url, banner_url) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          name, 
          code, 
          description, 
          req.user.id,
          primary_color || '#ea580c',
          logo_url,
          banner_url
        );
        const orgId = result.lastInsertRowid;
        
        // Adiciona o criador como dono na tabela de membros (exceto se for admin global)
        if (req.user.role !== 'admin') {
          db.prepare("INSERT INTO organization_members (user_id, organization_id, role) VALUES (?, ?, ?)").run(req.user.id, orgId, 'owner');
        }
        
        // Define como organização ativa
        db.prepare("UPDATE users SET organization_id = ? WHERE id = ?").run(orgId, req.user.id);
        
        return { id: orgId, code };
      });

      const result = transaction();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar organização" });
    }
  });

  app.put("/api/organizations/my", authenticateToken, (req: any, res) => {
    const { name, description, primary_color, logo_url, banner_url } = req.body;
    const orgId = req.user.organization_id;

    if (!orgId) return res.status(400).json({ error: "Usuário sem organização" });
    if (req.user.org_role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Apenas o dono pode editar a organização" });
    }

    try {
      db.prepare("UPDATE organizations SET name = ?, description = ?, primary_color = ?, logo_url = ?, banner_url = ? WHERE id = ?").run(
        name,
        description,
        primary_color,
        logo_url,
        banner_url,
        orgId
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar organização" });
    }
  });

  app.post("/api/organizations/join", authenticateToken, (req: any, res) => {
    if (req.user.role === 'admin') {
      return res.status(400).json({ error: "Administradores globais não podem entrar em organizações como membros. Use o painel de admin para acessar." });
    }
    const { code } = req.body;
    const org: any = db.prepare("SELECT * FROM organizations WHERE code = ?").get(code);
    
    if (!org) {
      return res.status(404).json({ error: "Código de organização inválido" });
    }

    try {
      const transaction = db.transaction(() => {
        // Se o usuário for o dono original da organização, restaura o cargo de dono
        const role = req.user.id === org.owner_id ? 'owner' : 'member';
        
        // Adiciona à tabela de membros
        db.prepare("INSERT OR REPLACE INTO organization_members (user_id, organization_id, role) VALUES (?, ?, ?)").run(req.user.id, org.id, role);
        
        // Define como ativa
        db.prepare("UPDATE users SET organization_id = ? WHERE id = ?").run(org.id, req.user.id);
      });
      transaction();
      res.json({ success: true, organization: org });
    } catch (e) {
      res.status(500).json({ error: "Erro ao entrar na organização" });
    }
  });

  app.get("/api/organizations/members", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json([]);
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar_url, om.role as org_role 
      FROM users u 
      JOIN organization_members om ON u.id = om.user_id 
      WHERE om.organization_id = ? AND u.role != 'admin'
    `).all(orgId);
    res.json(members);
  });

  app.put("/api/organizations/members/:userId/role", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    const { role } = req.body;
    
    // Apenas o admin global pode dar o cargo de dono (owner)
    if (role === 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Apenas o administrador global pode atribuir o cargo de dono." });
    }

    // Apenas dono, moderador ou admin global pode mudar cargos
    if (req.user.org_role !== 'owner' && req.user.org_role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Você não tem permissão para alterar cargos." });
    }

    // O cargo 'admin' é exclusivo para o perfil de administrador global
    if (role === 'admin') {
      return res.status(403).json({ error: "O cargo 'admin' é exclusivo para o administrador global do sistema." });
    }

    // Moderador não pode alterar cargo de dono ou de outros moderadores (só membros comuns)
    if (req.user.org_role === 'moderator' && req.user.role !== 'admin') {
      const target: any = db.prepare("SELECT role FROM organization_members WHERE user_id = ? AND organization_id = ?").get(req.params.userId, orgId);
      if (target && (target.role === 'owner' || target.role === 'moderator')) {
        return res.status(403).json({ error: "Moderadores só podem alterar cargos de membros comuns." });
      }
    }

    // Buscar o alvo para verificar restrições
    const targetMember: any = db.prepare("SELECT role FROM organization_members WHERE user_id = ? AND organization_id = ?").get(req.params.userId, orgId);
    if (!targetMember) return res.status(404).json({ error: "Membro não encontrado." });

    // Dono não pode ter seu cargo alterado por outros (exceto admin global)
    if (targetMember.role === 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "O cargo de dono não pode ser alterado." });
    }

    db.prepare("UPDATE organization_members SET role = ? WHERE user_id = ? AND organization_id = ?").run(role, req.params.userId, orgId);
    res.json({ success: true });
  });

  app.post("/api/organizations/transfer-ownership", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    const { newOwnerId } = req.body;

    if (req.user.org_role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Apenas o dono pode transferir a propriedade" });
    }

    try {
      const transaction = db.transaction(() => {
        // Novo dono
        db.prepare("UPDATE organization_members SET role = 'owner' WHERE user_id = ? AND organization_id = ?").run(newOwnerId, orgId);
        db.prepare("UPDATE organizations SET owner_id = ? WHERE id = ?").run(newOwnerId, orgId);
        
        // Antigo dono vira admin ou moderador? Vamos deixar como admin por padrão após transferir
        db.prepare("UPDATE organization_members SET role = 'admin' WHERE user_id = ? AND organization_id = ?").run(req.user.id, orgId);
      });
      transaction();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao transferir propriedade" });
    }
  });

  app.post("/api/organizations/leave", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    const { action, newOwnerId } = req.body; // 'delete', 'transfer' ou 'leave'

    try {
      if (action === 'delete') {
        if (req.user.org_role !== 'owner' && req.user.role !== 'admin') {
          return res.status(403).json({ error: "Apenas o dono pode excluir a organização" });
        }
        const transaction = db.transaction(() => {
          db.prepare("DELETE FROM reservations WHERE room_id IN (SELECT id FROM rooms WHERE organization_id = ?)").run(orgId);
          db.prepare("DELETE FROM rooms WHERE organization_id = ?").run(orgId);
          db.prepare("DELETE FROM resources WHERE organization_id = ?").run(orgId);
          db.prepare("DELETE FROM organization_members WHERE organization_id = ?").run(orgId);
          db.prepare("UPDATE users SET organization_id = NULL WHERE organization_id = ?").run(orgId);
          db.prepare("DELETE FROM organizations WHERE id = ?").run(orgId);
        });
        transaction();
        res.json({ success: true, message: "Organização excluída" });
      } else if (action === 'transfer') {
        if (req.user.org_role !== 'owner' && req.user.role !== 'admin') {
          return res.status(403).json({ error: "Apenas o dono pode transferir a propriedade" });
        }
        if (!newOwnerId) return res.status(400).json({ error: "Novo dono não especificado" });
        
        const transaction = db.transaction(() => {
          db.prepare("UPDATE organization_members SET role = 'owner' WHERE user_id = ? AND organization_id = ?").run(newOwnerId, orgId);
          db.prepare("UPDATE organizations SET owner_id = ? WHERE id = ?").run(newOwnerId, orgId);
          db.prepare("DELETE FROM organization_members WHERE user_id = ? AND organization_id = ?").run(req.user.id, orgId);
          db.prepare("UPDATE users SET organization_id = NULL WHERE id = ?").run(req.user.id);
        });
        transaction();
        res.json({ success: true, message: "Propriedade transferida e você saiu da organização" });
      } else if (action === 'leave') {
        // Se for o dono, não pode apenas sair
        if (req.user.org_role === 'owner' && req.user.role !== 'admin') {
          return res.status(400).json({ error: "O dono deve transferir a propriedade ou excluir a organização antes de sair." });
        }
        
        db.prepare("DELETE FROM organization_members WHERE user_id = ? AND organization_id = ?").run(req.user.id, orgId);
        db.prepare("UPDATE users SET organization_id = NULL WHERE id = ?").run(req.user.id);
        res.json({ success: true, message: "Você saiu da organização" });
      } else {
        res.status(400).json({ error: "Ação inválida" });
      }
    } catch (e) {
      res.status(500).json({ error: "Erro ao processar saída" });
    }
  });

  app.delete("/api/organizations/members/:userId", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    
    // Hierarquia de cargos
    const isOwner = req.user.org_role === 'owner';
    const isGlobalAdmin = req.user.role === 'admin';
    const isOrgModerator = req.user.org_role === 'moderator';

    // Apenas donos e moderadores (e admin global) podem expulsar membros
    if (!isOwner && !isGlobalAdmin && !isOrgModerator) {
      return res.status(403).json({ error: "Apenas o dono ou moderadores da organização podem expulsar membros." });
    }

    const targetMember: any = db.prepare("SELECT role FROM organization_members WHERE user_id = ? AND organization_id = ?").get(req.params.userId, orgId);
    if (!targetMember) return res.status(404).json({ error: "Membro não encontrado." });

    if (Number(req.params.userId) === req.user.id) {
      return res.status(400).json({ error: "Você não pode se remover por aqui. Use a opção de sair." });
    }

    const targetRole = targetMember.role;

    // Se não for Dono nem Admin Global, aplicamos as restrições de hierarquia
    if (!isOwner && !isGlobalAdmin) {
      // Moderador da organização pode remover membros
      if (isOrgModerator && (targetRole === 'owner' || targetRole === 'moderator')) {
        return res.status(403).json({ error: "Moderadores não podem remover o dono ou outros moderadores." });
      }
    }

    db.prepare("DELETE FROM organization_members WHERE user_id = ? AND organization_id = ?").run(req.params.userId, orgId);
    db.prepare("UPDATE users SET organization_id = NULL WHERE id = ? AND organization_id = ?").run(req.params.userId, orgId);
    res.json({ success: true });
  });

  // Rotas de Salas
  app.get("/api/rooms", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json([]);
    const rooms = db.prepare("SELECT * FROM rooms WHERE organization_id = ?").all(orgId);
    res.json(rooms);
  });

  app.post("/api/rooms", authenticateToken, isOrgAdmin, (req: any, res) => {
    const { name, capacity, location, description, image_url, google_meet_url, type } = req.body;
    const orgId = req.user.organization_id;
    if (!orgId) return res.status(400).json({ error: "Usuário sem organização" });
    
    const result = db.prepare("INSERT INTO rooms (name, capacity, location, description, image_url, google_meet_url, type, organization_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(name, capacity || 0, location || '', description, image_url, google_meet_url, type || 'physical', orgId);
    broadcast({ type: "data_change", section: "rooms" });
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/rooms/:id", authenticateToken, isOrgAdmin, (req: any, res) => {
    const { name, capacity, location, description, image_url, google_meet_url, type } = req.body;
    const orgId = req.user.organization_id;
    db.prepare("UPDATE rooms SET name = ?, capacity = ?, location = ?, description = ?, image_url = ?, google_meet_url = ?, type = ? WHERE id = ? AND organization_id = ?").run(name, capacity || 0, location || '', description, image_url, google_meet_url, type || 'physical', req.params.id, orgId);
    broadcast({ type: "data_change", section: "rooms" });
    res.json({ success: true });
  });

  app.delete("/api/rooms/:id", authenticateToken, isOrgAdmin, (req: any, res) => {
    const roomId = Number(req.params.id);
    const orgId = req.user.organization_id;
    try {
      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM reservations WHERE room_id = ?").run(roomId);
        const roomDelete = db.prepare("DELETE FROM rooms WHERE id = ? AND organization_id = ?").run(roomId, orgId);
        if (roomDelete.changes === 0) throw new Error("Sala não encontrada ou não pertence à sua organização");
      });
      transaction();
      broadcast({ type: "data_change", section: "rooms" });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Falha ao excluir sala" });
    }
  });

  // Rotas de Recursos
  app.get("/api/resources", authenticateToken, (req: any, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json([]);
    const resources = db.prepare("SELECT * FROM resources WHERE organization_id = ?").all(orgId);
    res.json(resources);
  });

  app.post("/api/resources", authenticateToken, isOrgAdmin, (req: any, res) => {
    const { name, description, icon } = req.body;
    const orgId = req.user.organization_id;
    if (!orgId) return res.status(400).json({ error: "Usuário sem organização" });

    const result = db.prepare("INSERT INTO resources (name, description, icon, organization_id) VALUES (?, ?, ?, ?)").run(name, description, icon || 'Box', orgId);
    broadcast({ type: "data_change", section: "resources" });
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/resources/:id", authenticateToken, isOrgAdmin, (req: any, res) => {
    const resId = Number(req.params.id);
    const orgId = req.user.organization_id;
    try {
      const result = db.prepare("DELETE FROM resources WHERE id = ? AND organization_id = ?").run(resId, orgId);
      if (result.changes === 0) return res.status(404).json({ error: "Recurso não encontrado" });
      broadcast({ type: "data_change", section: "resources" });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Falha ao excluir recurso" });
    }
  });

  // Rotas de Reservas
  app.get("/api/reservations", authenticateToken, (req: any, res) => {
    let reservations;
    
    if (req.user.role === 'admin') {
      // Admin global vê tudo
      reservations = db.prepare(`
        SELECT r.*, u.name as user_name, u.avatar_url as user_avatar_url, rm.name as room_name, o.name as organization_name, o.id as organization_id
        FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN rooms rm ON r.room_id = rm.id
        LEFT JOIN organizations o ON rm.organization_id = o.id
      `).all();
    } else {
      // Usuário comum vê apenas de suas organizações
      reservations = db.prepare(`
        SELECT r.*, u.name as user_name, u.avatar_url as user_avatar_url, rm.name as room_name, o.name as organization_name, o.id as organization_id
        FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN rooms rm ON r.room_id = rm.id
        LEFT JOIN organizations o ON rm.organization_id = o.id
        WHERE rm.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = ?)
      `).all(req.user.id);
    }
    
    const reservationsWithResources = reservations.map((resv: any) => {
      const resources = db.prepare(`
        SELECT r.* FROM resources r
        JOIN reservation_resources rr ON r.id = rr.resource_id
        WHERE rr.reservation_id = ?
      `).all(resv.id);
      return { ...resv, resources };
    });

    res.json(reservationsWithResources);
  });

  app.post("/api/reservations", authenticateToken, (req: any, res) => {
    const { room_id, start_time, end_time, title, description, resource_ids } = req.body;
    const user_id = req.user.id;

    // Verifica conflitos de horário na sala
    const conflict = db.prepare(`
      SELECT * FROM reservations 
      WHERE room_id = ? 
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `).get(room_id, end_time, start_time, start_time, start_time, start_time, end_time);

    if (conflict) {
      return res.status(400).json({ error: "A sala já está reservada para este período" });
    }

    // Verifica conflitos de recursos
    if (resource_ids && resource_ids.length > 0) {
      for (const resId of resource_ids) {
        const resConflict = db.prepare(`
          SELECT * FROM reservation_resources rr
          JOIN reservations r ON rr.reservation_id = r.id
          WHERE rr.resource_id = ?
          AND (
            (r.start_time < ? AND r.end_time > ?) OR
            (r.start_time < ? AND r.end_time > ?) OR
            (r.start_time >= ? AND r.end_time <= ?)
          )
        `).get(resId, end_time, start_time, start_time, start_time, start_time, end_time);

        if (resConflict) {
          return res.status(400).json({ error: `O recurso ID ${resId} já está em uso para este período` });
        }
      }
    }

    // Executa a reserva e associação de recursos em uma transação
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO reservations (user_id, room_id, start_time, end_time, title, description) VALUES (?, ?, ?, ?, ?, ?)").run(
        user_id, room_id, start_time, end_time, title, description
      );
      const reservationId = result.lastInsertRowid;

      if (resource_ids && resource_ids.length > 0) {
        const insertResource = db.prepare("INSERT INTO reservation_resources (reservation_id, resource_id) VALUES (?, ?)");
        for (const resId of resource_ids) {
          insertResource.run(reservationId, resId);
        }
      }
      return reservationId;
    });

    try {
      const id = transaction();
      broadcast({ type: "data_change", section: "reservations" });
      
      // Notifica o usuário sobre a reserva concluída
      const room: any = db.prepare("SELECT name FROM rooms WHERE id = ?").get(room_id);
      sendNotification(user_id, "Reserva Confirmada", `Sua reserva para "${title}" na ${room?.name || 'sala'} foi criada com sucesso.`, 'success');
      
      res.json({ id });
    } catch (error) {
      res.status(500).json({ error: "Falha ao criar reserva" });
    }
  });

  app.delete("/api/reservations/:id", authenticateToken, (req: any, res) => {
    const resId = req.params.id;
    const userId = req.user.id;
    console.log(`[DELETE] Tentativa de exclusão da reserva ${resId} pelo usuário ${userId} (cargo: ${req.user.role})`);
    
    const reservation: any = db.prepare("SELECT * FROM reservations WHERE id = ?").get(resId);
    if (!reservation) {
      console.log(`[DELETE] Reserva ${resId} não encontrada`);
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    console.log(`[DELETE] Reserva encontrada:`, reservation);

    const isOwner = Number(reservation.user_id) === Number(userId);
    const isAdmin = req.user.role === 'admin';

    // Apenas o dono ou admin pode excluir
    if (!isAdmin && !isOwner) {
      console.log(`[DELETE] Tentativa não autorizada. Dono: ${reservation.user_id}, Requisitante: ${userId}`);
      return res.status(403).json({ error: "Não autorizado" });
    }

    try {
      db.prepare("DELETE FROM reservations WHERE id = ?").run(resId);
      console.log(`[DELETE] Reserva ${resId} excluída com sucesso`);
      broadcast({ type: "data_change", section: "reservations" });

      // Notifica o usuário sobre o cancelamento
      sendNotification(reservation.user_id, "Reserva Cancelada", `Sua reserva "${reservation.title}" foi cancelada.`, 'warning');

      res.json({ success: true });
    } catch (err: any) {
      console.error(`[DELETE] Erro ao excluir reserva ${resId}:`, err);
      res.status(500).json({ error: "Falha ao excluir reserva" });
    }
  });

  // Rotas de Notificações
  app.get("/api/notifications", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    const notifications = db.prepare(`
      SELECT * FROM system_notifications 
      WHERE user_id = ? OR user_id IS NULL 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId);
    res.json(notifications);
  });

  app.post("/api/notifications/read-all", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    db.prepare("UPDATE system_notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL").run(userId);
    res.json({ success: true });
  });

  app.post("/api/notifications/:id/read", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    const notifId = req.params.id;
    db.prepare("UPDATE system_notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)").run(notifId, userId);
    res.json({ success: true });
  });

  app.delete("/api/notifications/:id", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    const notifId = req.params.id;
    db.prepare("DELETE FROM system_notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)").run(notifId, userId);
    res.json({ success: true });
  });

  app.post("/api/notifications/seed-samples", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    const samples = [
      { title: "Bem-vindo ao InsideManager", message: "Estamos felizes em ter você aqui! Explore as salas e comece a agendar suas reuniões.", type: "success" },
      { title: "Dica de Produtividade", message: "Você sabia que pode reservar equipamentos junto com a sala? Tente adicionar um projetor na sua próxima reserva.", type: "info" },
      { title: "Atualização do Sistema", message: "Novas funcionalidades de gerenciamento de organizações foram adicionadas.", type: "info" },
      { title: "Lembrete de Perfil", message: "Não esqueça de completar seu perfil para que outros membros possam te identificar melhor.", type: "warning" }
    ];

    for (const s of samples) {
      sendNotification(userId, s.title, s.message, s.type as any);
    }
    res.json({ success: true });
  });

  app.post("/api/admin/announce", authenticateToken, isAdmin, (req, res) => {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ error: "Título e mensagem são obrigatórios" });
    
    sendNotification(null, title, message, type || 'info');
    res.json({ success: true });
  });

  // Gerenciamento de Usuários (Admin Global ou da Organização)
  app.get("/api/users", authenticateToken, isOrgAdmin, (req: any, res) => {
    if (req.user.role === 'admin') {
      const users = db.prepare("SELECT id, name, email, role, avatar_url FROM users").all();
      return res.json(users);
    }
    
    // Se for admin de organização, retorna apenas membros da organização
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, om.role as org_role 
      FROM users u
      JOIN organization_members om ON u.id = om.user_id
      WHERE om.organization_id = ?
    `).all(req.user.organization_id);
    res.json(users);
  });

  app.delete("/api/users/:id", authenticateToken, isOrgAdmin, (req: any, res) => {
    const userId = Number(req.params.id);
    const requester = req.user;

    console.log(`[ADMIN] Tentativa de excluir usuário ID: ${userId} por ${requester.email}`);
    
    try {
      if (requester.role !== 'admin') {
        // Se não for admin global, verifica se o alvo está na mesma organização
        const target: any = db.prepare("SELECT organization_id FROM users WHERE id = ?").get(userId);
        if (!target || target.organization_id !== requester.organization_id) {
          return res.status(403).json({ error: "Você não tem permissão para excluir este usuário ou ele não pertence à sua organização." });
        }
      }

      const transaction = db.transaction(() => {
        // Deleta reservas do usuário primeiro
        const resvDelete = db.prepare("DELETE FROM reservations WHERE user_id = ?").run(userId);
        console.log(`[ADMIN] ${resvDelete.changes} reservas removidas para o usuário ${userId}`);
        
        // Remove da tabela de membros da organização
        db.prepare("DELETE FROM organization_members WHERE user_id = ?").run(userId);

        // Deleta o usuário
        const userDelete = db.prepare("DELETE FROM users WHERE id = ?").run(userId);
        if (userDelete.changes === 0) throw new Error("Usuário não encontrado");
        console.log(`[ADMIN] Usuário ${userId} excluído com sucesso`);
      });
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error(`[ADMIN] Erro ao excluir usuário ${userId}:`, err);
      res.status(500).json({ error: err.message || "Falha ao excluir usuário" });
    }
  });

  // Configuração do Vite para desenvolvimento ou arquivos estáticos para produção
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
