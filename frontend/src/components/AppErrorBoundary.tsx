import {Component,type ErrorInfo,type ReactNode} from 'react';

type Props={children:ReactNode};
type State={failed:boolean};

/** Keep an actionable screen visible if a UI component fails to render. */
export class AppErrorBoundary extends Component<Props,State>{
  state:State={failed:false};
  static getDerivedStateFromError():State{return {failed:true};}
  componentDidCatch(error:Error,info:ErrorInfo){
    console.error('Timetable UI render failed',error,info.componentStack);
  }
  render(){
    if(this.state.failed){
      return <section role="alert" className="timetable-render-error" style={{padding:'2rem',maxWidth:640,margin:'5rem auto',fontFamily:'sans-serif'}}>
        <h1>시간표 화면을 표시하지 못했습니다.</h1>
        <p>저장 작업이 진행되었을 수 있습니다. 다시 실행하기 전에 최신 시간표와 작업 이력을 확인해 주세요.</p>
        <button type="button" onClick={()=>this.setState({failed:false})}>화면 다시 표시</button>
      </section>;
    }
    return this.props.children;
  }
}
