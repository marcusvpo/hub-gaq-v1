const fs = require('fs');

function refactorLayout(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add Zustand store import
  if (!content.includes('@/store/useAppStore')) {
    content = content.replace(
      'import { useState } from "react";',
      'import { useState } from "react";\nimport { useAppStore } from "@/store/useAppStore";'
    );
  }

  // Add ChevronLeft/ChevronRight to lucide-react if not there
  if (!content.includes('ChevronLeft')) {
    content = content.replace(
      '  X,\n} from "lucide-react";',
      '  X,\n  ChevronLeft,\n  ChevronRight,\n} from "lucide-react";'
    );
  }

  // Add store variables
  if (!content.includes('isSidebarCollapsed')) {
    content = content.replace(
      'const handleSignOut',
      'const { isSidebarCollapsed, toggleSidebar } = useAppStore();\n\n  const handleSignOut'
    );
  }

  // Add collapsed class to sidebar
  content = content.replace(
    /className=\{\`sidebar \$\{isMobileMenuOpen \? "mobile-open" \: ""\}\`\}/g,
    'className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""} ${isSidebarCollapsed ? "collapsed" : ""}`}'
  );

  // Add collapsed class to main-content
  content = content.replace(
    /<main className="main-content">/g,
    '<main className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>'
  );

  // Replace text inside NavLink with span
  // e.g. <LayoutDashboard className="icon" /> Dashboard
  // -> <LayoutDashboard className="icon" /> <span className="nav-label">Dashboard</span>
  content = content.replace(
    /<([A-Za-z0-9]+) className="icon" \/> (.*?)<\/NavLink>/g,
    '<$1 className="icon" /> <span className="nav-label">$2</span></NavLink>'
  );
  content = content.replace(
    /<LogOut className="icon" \/> Sair/g,
    '<LogOut className="icon" /> <span className="nav-label">Sair</span>'
  );

  // Add collapse toggle button to sidebar-header
  if (!content.includes('toggleSidebar')) {
    // Actually we just added it above, but button doesn't exist
  }
  if (!content.includes('<!-- toggle btn -->') && !content.includes('title="Recolher Menu"')) {
    content = content.replace(
      '<div className="sidebar-header">',
      '<div className="sidebar-header" style={{ position: "relative" }}>'
    );

    // After <button className="btn-icon"... > for mobile...
    // Let's place it right before <nav>
    content = content.replace(
      '        <nav\n          className="sidebar-nav"',
      '        <button\n          onClick={toggleSidebar}\n          style={{\n            position: "absolute",\n            right: -12,\n            top: 24,\n            background: "#fff",\n            border: "1px solid #E2E8F0",\n            borderRadius: "50%",\n            width: 24,\n            height: 24,\n            display: "flex",\n            alignItems: "center",\n            justifyContent: "center",\n            cursor: "pointer",\n            zIndex: 10,\n            color: "#64748B",\n            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"\n          }}\n          className="desktop-only-toggle"\n        >\n          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}\n        </button>\n\n        <nav\n          className="sidebar-nav"'
    );
  }

  // Client Picker text replacement
  content = content.replace(
    /\{hasCliente\n\s*\?\s*selectedCliente\.nome_fantasia\n\s*:\s*"Selecione um cliente"\}/g,
    '{hasCliente ? selectedCliente.nome_fantasia : "Selecione um cliente"}'
  );
  // Actually we need to wrap the whole client picker span text
  content = content.replace(
    /<span\n\s*style=\{\{\n\s*overflow: "hidden",\n\s*textOverflow: "ellipsis",\n\s*whiteSpace: "nowrap",\n\s*\}\}\n\s*>\n\s*\{hasCliente/g,
    '<span\n                  className="nav-label"\n                  style={{\n                    overflow: "hidden",\n                    textOverflow: "ellipsis",\n                    whiteSpace: "nowrap",\n                  }}\n                >\n                  {hasCliente'
  );

  fs.writeFileSync(filePath, content);
}

refactorLayout('src/layouts/AdminLayout.tsx');
refactorLayout('src/layouts/ClientLayout.tsx');
