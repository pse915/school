"""Minimal hooks into the existing authenticated React application."""
TAB='시험감독 관리'
def install(app):
    ns=app.program.namespace;app._exam_service=None;original=ns['get_user_allowed_tabs']
    def allowed_tabs():
        tabs=list(original())
        if app.port.session_state.get('logged_in') and ns['can_manage_ids']() and TAB not in tabs:tabs.append(TAB)
        return tabs
    ns['get_user_allowed_tabs']=allowed_tabs
    if TAB not in ns['ALL_APP_TABS']:ns['ALL_APP_TABS'].append(TAB)
    toolbar=ns['render_top_toolbar']
    def exam_toolbar(tabs):
        current=list(tabs)
        if TAB in allowed_tabs() and TAB not in current:current.append(TAB)
        toolbar(current)
        if app.port.session_state.get('active_tab')==TAB:
            from .view import render
            render(app.port,get_service(app));app.port.stop()
    ns['render_top_toolbar']=exam_toolbar

def get_service(app):
    identity=tuple(app.port.session_state.get(k) for k in ('user_id','user_name','user_role'))
    if app._exam_service is not None and app._exam_service.owner!=identity:app._exam_service.close();app._exam_service=None
    if app._exam_service is None:
        from .service import Service
        app._exam_service=Service(app)
    return app._exam_service

def clear(app):
    if getattr(app,'_exam_service',None) is not None:app._exam_service.close();app._exam_service=None
