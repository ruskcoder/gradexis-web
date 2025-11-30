import React from 'react'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ListItemsList({ children, minWidth = '275px' }) {
  return (
    <div
      className='gap-2'
      style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`, justifyItems: 'stretch' }}
    >
      {children && React.Children.map(children, child => child)}
    </div>
  )
}

export default function ListItem({ squareColor, squareText, Title, Desc, popoverContent = null, onClick = null, rightContent = null, minWidth = '275px' }) {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const adjustedColor = isDark 
    ? `color-mix(in srgb, ${squareColor} 70%, black 30%)`
    : squareColor;

  const content = (
    <Item 
      variant="outline" 
      className="p-2 max-w-[1000px] cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
      style={{ minWidth }}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center min-w-0 flex-1">
          <ItemActions className="flex-shrink-0 align-middle justify-center h-11 aspect-square rounded-sm mr-2" style={{ backgroundColor: adjustedColor }}>
            {typeof squareText === 'string' || typeof squareText === 'number' ? (
              <span className='font-semibold tracking-wide text-[1.35rem] text-white'>
                {squareText}
              </span>
            ) : (
              <div className='text-white flex items-center justify-center'>
                {squareText}
              </div>
            )}
          </ItemActions>
          <ItemContent className="gap-0 ml-1 mr-3 min-w-0">
            <ItemTitle className="text-base font-semibold truncate block">
              {Title}
            </ItemTitle>
            <ItemDescription className="truncate block">
              {Desc}
            </ItemDescription>
          </ItemContent>
        </div>
        {rightContent && (
          <div className="flex-shrink-0 ml-2">
            {rightContent}
          </div>
        )}
      </div>
    </Item>
  );

  if (popoverContent) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {content}
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[90vw]">
          {popoverContent}
        </PopoverContent>
      </Popover>
    );
  }

  return content;
}
