import { MouseEvent, forwardRef, useImperativeHandle, useState, useRef, CSSProperties, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useAppDispatch } from "@/store/hooks";
import {
    enableMainScrolling
} from "@/store/coreSlice"
import { player } from '@/business/player';
import './ContextMenu.scss'

export type ContextMenuHandle = {
    openMenu: (e: MouseEvent) => void;
};

type ContextMenuProps = {
    children: ReactNode[] | ReactNode
};

const ContextMenu = forwardRef<ContextMenuHandle, ContextMenuProps>(({ children }, ref) => {
    const dispatch = useAppDispatch();
    const [showMenu, setShowMenu] = useState(false);
    const menu = useRef<HTMLDivElement>(null);
    const [contextMenuStyle, setContextMenuStyle] = useState<CSSProperties>({
        top: 0,
        left: 0
    });

    useImperativeHandle(ref, () => ({
        openMenu(e) {
            setShowMenu(true);
            flushSync(() => {
                setMenu(e.clientY, e.clientX);
            });
            menu.current!.focus();
            e.preventDefault();
            dispatch(enableMainScrolling(false))
        },
    }));

    const setMenu = (top: number, left: number) => {
        let heightOffset = player.enabled ? 64 : 0;
        let largestHeight =
            window.innerHeight - menu.current!.offsetHeight - heightOffset;
        let largestWidth = window.innerWidth - menu.current!.offsetWidth - 25;
        if (top > largestHeight) top = largestHeight;
        if (left > largestWidth) left = largestWidth;
        setContextMenuStyle({
            top: top + 'px',
            left: left + 'px',
        })
    }

    const closeMenu = () => {
        setShowMenu(false);
        // if (this.$parent.closeMenu !== undefined) {
        //     this.$parent.closeMenu();
        // }
        dispatch(enableMainScrolling(true))
    }

    return (
        <div className='context-menu'>
            <div
                ref={menu}
                tabIndex={0}
                className={showMenu ? 'menu' : 'menu hidden'}
                style={contextMenuStyle}
                onBlur={closeMenu}
                onClick={closeMenu}>
                {children}
            </div>
        </div>
    );
})

export default ContextMenu;