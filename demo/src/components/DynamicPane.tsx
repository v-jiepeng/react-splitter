import * as React from 'react';
import { Split } from '@geoffcox/react-splitter';
//import { Split } from '../../../package/src/Split';
import styled, { css } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { createSplitOptions, splitStateFamily } from '../model/appModel';
import { SplitNode } from '../model/types';
import {
  VerticalSolidSplitter,
  VerticalStripedSplitter,
  HorizontalSolidSplitter,
  HorizontalStripedSplitter,
} from './CustomSplitters';

const fullDivCss = css`
  width: 100%;
  height: 100%;
  outline: none;
  overflow: hidden;
`;

const Root = styled.div`
  ${fullDivCss}
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  grid-template-areas: 'content';
  user-select: none;
`;

const DemoActions = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  align-items: center;
  outline: none;
  overflow: hidden;
  margin: auto auto;
  font-family: 'Consolas', 'Courier New', Courier, monospace;
  font-size: 10pt;
`;

const ActionButton = styled.button`
  padding: 5px;
  margin: 0 0 5px 5px;
  user-select: none;
`;

type Props = {
  id: string;
  onRemove?: (childId: string) => void;
};

export const DynamicPane = (props: Props) => {
  const { id, onRemove } = props;

  const [splitNode, setSplitNode] = useRecoilState(splitStateFamily(id));
  const { options, primaryId, secondaryId } = splitNode;

  const createOptions = useRecoilValue(createSplitOptions);

  const onSplit = () => {
    const primaryId = uuidv4();
    const secondaryId = uuidv4();
    const newNode: SplitNode = {
      ...splitNode,
      options: createOptions,
      primaryId,
      secondaryId,
    };

    setSplitNode(newNode);
  };

  /**
   * When the child pane notifies it wants to be removed, the remaining pane should 'replace' this pane.
   * We do this by saving the remaining pane's split options as this pane's split options.
   * Finally, we clear up the child and remaining state.
   */
  const onRemoveChildPane = useRecoilCallback(
    ({ snapshot, set, reset }) => async (childId: string) => {
      const node = await snapshot.getPromise(splitStateFamily(id));

      const remainingId =
        node?.primaryId === childId ? node.secondaryId : node?.secondaryId === childId ? node.primaryId : undefined;

      if (remainingId === undefined) {
        return;
      }

      const remainingNode = await snapshot.getPromise(splitStateFamily(remainingId));

      set(splitStateFamily(id), {
        ...remainingNode,
        id: node.id,
      });

      reset(splitStateFamily(childId));
      reset(splitStateFamily(remainingId));
    },
    [id]
  );

  const renderActions = () => {
    return (
      <>
        <DemoActions>
          <ActionButton onClick={onSplit}>Split</ActionButton>
          {onRemove && (
            <ActionButton onClick={() => onRemove(id)} title="Remove Split">
              X
            </ActionButton>
          )}
        </DemoActions>
      </>
    );
  };

  const getLeftRightRenderSplitterCallback = () => {
    switch (options?.splitterType) {
      case 'solid':
        return () => <VerticalSolidSplitter />;
      case 'striped':
        return () => <VerticalStripedSplitter />;
      default:
        return undefined;
    }
  };

  const renderLeftRightSplit = () => {
    return (
      options && (
        <Split
          initialPrimarySize={options.initialPrimarySize}
          minPrimarySize={options.minPrimarySize}
          minSecondarySize={options.minSecondarySize}
          renderSplitter={getLeftRightRenderSplitterCallback()}
          splitterSize={options.splitterSize}
          resetOnDoubleClick
        >
          {primaryId ? <DynamicPane id={primaryId} onRemove={onRemoveChildPane} /> : <div>ERROR</div>}
          {secondaryId ? <DynamicPane id={secondaryId} onRemove={onRemoveChildPane} /> : <div>ERROR</div>}
        </Split>
      )
    );
  };

  const getTopBottomRenderSplitterCallback = () => {
    switch (options?.splitterType) {
      case 'solid':
        return () => <HorizontalSolidSplitter />;
      case 'striped':
        return () => <HorizontalStripedSplitter />;
      default:
        return undefined;
    }
  };

  const renderTopBottomSplit = () => {
    return (
      <Split
        horizontal
        initialPrimarySize={options?.initialPrimarySize}
        minPrimarySize={options?.minPrimarySize}
        minSecondarySize={options?.minSecondarySize}
        renderSplitter={getTopBottomRenderSplitterCallback()}
        splitterSize={options?.splitterSize}
        resetOnDoubleClick
      >
        {primaryId ? <DynamicPane id={primaryId} onRemove={onRemoveChildPane} /> : <div>ERROR</div>}
        {secondaryId ? <DynamicPane id={secondaryId} onRemove={onRemoveChildPane} /> : <div>ERROR</div>}
      </Split>
    );
  };

  const renderLayout = () => {
    return options ? (options.horizontal ? renderTopBottomSplit() : renderLeftRightSplit()) : renderActions();
  };

  return <Root>{renderLayout()}</Root>;
};
