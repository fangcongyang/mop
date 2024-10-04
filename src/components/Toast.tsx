import { useRef } from 'react';
import { Transition } from 'react-transition-group';
import { useAppSelector } from "@/store/hooks";
import {
    toastStore
} from "@/store/coreSlice"
import './Toast.scss'

const Toast = () => {
    const nodeRef = useRef(null);
    const toast = useAppSelector(toastStore);

    return (
        <Transition nodeRef={nodeRef} in={toast.show} name="toast-fade" timeout={200}>
            {(state) => (
                <div ref={nodeRef} 
                    className={`toast toast-fade toast-fade-${state}`}>
                    { toast.text }
                </div>
            )}
        </Transition>
    )
}

export default Toast;