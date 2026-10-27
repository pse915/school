from diple.sectioning import SectioningPlanService,SectioningError

def save_confirmed(service,token,school,snapshot,plan):
    from .install import resource_errors
    errors=resource_errors(plan)
    if errors:raise SectioningError(' / '.join(errors))
    candidate={**plan,'resources_confirmed':True}
    return SectioningPlanService(service).save(token,school,snapshot,candidate,'교사·교실 충돌 검증 완료',ack_warnings=True)
